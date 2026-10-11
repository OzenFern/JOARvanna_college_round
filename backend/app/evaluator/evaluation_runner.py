"""Evaluation Runner producing the full defense matrix"""

import json
import uuid
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.core.contracts import EvaluationSummary
from app.evaluator.benign_suite import BenignSuiteRunner
from app.redteam.runner import CampaignRunner

DEFENSE_CONFIGS = ["D0", "D1", "D2", "D3", "D1+D2+D3"]

# In-memory store for evaluation summaries
_EVALUATION_CACHE: Dict[str, List[EvaluationSummary]] = {}

class EvaluationRunner:
    def __init__(
        self,
        model_adapter_type: str = "mock",
        trials_per_attack: int = 1,
        api_key: Optional[str] = None,
    ):
        self.model_adapter_type = model_adapter_type
        self.trials_per_attack = trials_per_attack
        self.api_key = api_key

    def run_matrix(
        self,
        defenses: Optional[List[str]] = None,
        attack_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Executes attacks and benign tasks across defense configurations.
        Produces one EvaluationSummary row per defense.
        """
        eval_id = str(uuid.uuid4())
        target_defenses = defenses or DEFENSE_CONFIGS

        summaries: List[EvaluationSummary] = []
        d0_succeeded_attacks: set[str] = set()

        for defense in target_defenses:
            # 1. Run Red-Team Attack Campaign
            campaign_runner = CampaignRunner(
                active_defense=defense,
                model_adapter_type=self.model_adapter_type,
                api_key=self.api_key,
            )
            attack_results = campaign_runner.run_campaign(
                attack_ids=attack_ids,
                trials=self.trials_per_attack,
            )

            total_trials = sum(r.trials for r in attack_results)
            total_successes = sum(r.successes for r in attack_results)
            attack_success_rate = (total_successes / total_trials) if total_trials > 0 else 0.0

            succeeded_in_this_defense = {r.attack_id for r in attack_results if r.successes > 0}

            if defense == "D0":
                d0_succeeded_attacks = succeeded_in_this_defense
                new_vulns_vs_baseline = 0
            else:
                # Any attack that succeeded here but NOT in D0
                new_vulns_vs_baseline = len(succeeded_in_this_defense - d0_succeeded_attacks)

            # 2. Run Benign Regression Suite
            benign_runner = BenignSuiteRunner(
                active_defense=defense,
                model_adapter_type=self.model_adapter_type,
                api_key=self.api_key,
            )
            benign_results = benign_runner.run_all()

            total_benign = len(benign_results)
            benign_passed = sum(1 for b in benign_results if b.passed)
            benign_pass_rate = (benign_passed / total_benign) if total_benign > 0 else 0.0

            total_approval_prompts = sum(b.approval_prompts for b in benign_results)
            benign_approval_rate = (total_approval_prompts / total_benign) if total_benign > 0 else 0.0

            summary = EvaluationSummary(
                active_defense=defense,
                model_adapter=self.model_adapter_type,
                attack_success_rate=round(attack_success_rate, 4),
                benign_pass_rate=round(benign_pass_rate, 4),
                benign_approval_rate=round(benign_approval_rate, 2),
                new_vulns_vs_baseline=new_vulns_vs_baseline,
                trials_per_attack=self.trials_per_attack,
            )
            summaries.append(summary)

        # Store in cache, database, and persist to disk
        _EVALUATION_CACHE[eval_id] = summaries

        try:
            from app.core.database import db
            db.save_evaluation_matrix(eval_id, [s.model_dump() for s in summaries])
        except Exception:
            pass

        eval_dir = settings.DATA_DIR / "evaluations"
        eval_dir.mkdir(parents=True, exist_ok=True)
        eval_file = eval_dir / f"{eval_id}.json"
        eval_file.write_text(
            json.dumps([s.model_dump() for s in summaries], indent=2),
            encoding="utf-8",
        )

        return {
            "evaluation_id": eval_id,
            "summaries": summaries,
        }

    @classmethod
    def get_latest_evaluation(cls) -> Optional[List[EvaluationSummary]]:
        if _EVALUATION_CACHE:
            latest_id = list(_EVALUATION_CACHE.keys())[-1]
            return _EVALUATION_CACHE[latest_id]

        try:
            from app.core.database import db
            db_evals = db.get_latest_evaluations()
            if db_evals:
                summaries = [EvaluationSummary(**row) for row in db_evals]
                return summaries
        except Exception:
            pass

        eval_dir = settings.DATA_DIR / "evaluations"
        if eval_dir.exists():
            files = sorted(eval_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
            if files:
                try:
                    data = json.loads(files[0].read_text(encoding="utf-8"))
                    summaries = [EvaluationSummary(**row) for row in data]
                    _EVALUATION_CACHE[files[0].stem] = summaries
                    return summaries
                except Exception:
                    pass
        return None

    @classmethod
    def get_evaluation(cls, eval_id: str) -> Optional[List[EvaluationSummary]]:
        if eval_id in _EVALUATION_CACHE:
            return _EVALUATION_CACHE[eval_id]

        eval_file = settings.DATA_DIR / "evaluations" / f"{eval_id}.json"
        if eval_file.exists():
            data = json.loads(eval_file.read_text(encoding="utf-8"))
            summaries = [EvaluationSummary(**row) for row in data]
            _EVALUATION_CACHE[eval_id] = summaries
            return summaries

        return None
