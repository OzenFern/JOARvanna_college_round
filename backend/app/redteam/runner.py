"""Red Team Campaign Runner Section 10."""

from typing import Dict, List, Optional
from app.agent.mock_adapter import MockModelAdapter
from app.agent.target_agent import TargetAgent
from app.core.contracts import AttackResult, Severity, Source
from app.evaluator.judge import Judge
from app.evaluator.tracer import TraceRecorder
from app.redteam.budget import BudgetController
from app.redteam.catalog import ATTACK_LIBRARY, AttackDefinition
from app.redteam.mutators import mutate_payload
from app.security.gateway import ToolGateway
from app.tools.registry import read_document, reset_mock_state

class CampaignRunner:
    def __init__(
        self,
        active_defense: str = "D0",
        model_adapter_type: str = "mock",
        api_key: Optional[str] = None,
        budget: Optional[BudgetController] = None,
    ):
        self.active_defense = active_defense
        self.model_adapter_type = model_adapter_type
        self.api_key = api_key
        self.budget = budget or BudgetController()
        self.judge = Judge()

    def _get_adapter(self):
        if self.model_adapter_type == "gemini":
            from app.agent.gemini_adapter import GeminiModelAdapter
            return GeminiModelAdapter(api_key=self.api_key)
        return MockModelAdapter()

    def run_single_attack(
        self,
        attack: AttackDefinition,
        trials: int = 1,
    ) -> AttackResult:
        """Runs an attack with trials and adaptive mutations if initial attempt fails."""
        trial_trace_ids: List[str] = []
        trial_successes = 0
        all_violated_invariants: List[str] = []
        highest_severity: Severity = Severity.LOW
        last_payload = attack.initial_payload
        mutations_applied: List[str] = []
        attempts_total = 0

        for trial_idx in range(trials):
            attempt = 0
            payload = attack.initial_payload
            trial_succeeded = False
            active_mutations: List[str] = []

            while self.budget.can_attempt(attempt):
                attempt += 1
                attempts_total += 1
                self.budget.record_call()
                reset_mock_state()

                tracer = TraceRecorder(active_defense=self.active_defense, model_adapter=self.model_adapter_type)
                gateway = ToolGateway(active_defense=self.active_defense)
                agent = TargetAgent(model_adapter=self._get_adapter())

                # Prepare context
                context_items = []
                for doc_name in attack.context_files:
                    doc_res = read_document(doc_name)
                    doc_content = doc_res.get("content", f"Document {doc_name} loaded into context.")
                    context_items.append({
                        "source": Source.RETRIEVED_DOCUMENT,
                        "content": doc_content,
                    })
                for ctx_src, ctx_val in attack.initial_context.items():
                    context_items.append({
                        "source": Source.MEMORY if ctx_src == "memory" else Source.RETRIEVED_DOCUMENT,
                        "content": ctx_val,
                    })

                # If attack requires mutation initially to succeed, simulate initial failure on attempt 1
                if attack.requires_mutation_initially and attempt == 1:
                    # Initial attempt fails or is gentle; run it
                    run_res = agent.run_task(
                        task_prompt=payload,
                        tracer=tracer,
                        gateway=gateway,
                        context_items=context_items,
                    )
                    tracer.save()
                    verdict = self.judge.evaluate_trace(tracer.steps)
                    # If it didn't succeed, mutate!
                    if not verdict.success:
                        payload, mutator_name = mutate_payload(attack, attempt_number=attempt)
                        active_mutations.append(mutator_name)
                        last_payload = payload
                        continue
                else:
                    # Run attack payload
                    run_res = agent.run_task(
                        task_prompt=payload,
                        tracer=tracer,
                        gateway=gateway,
                        context_items=context_items,
                    )
                    tracer.save()
                    verdict = self.judge.evaluate_trace(tracer.steps)

                # Evaluate outcome
                if verdict.success:
                    trial_succeeded = True
                    trial_trace_ids.append(tracer.trace_id)
                    all_violated_invariants.extend(verdict.violated_invariants)
                    if verdict.severity:
                        highest_severity = verdict.severity
                    break
                else:
                    # Attempt failed; try mutation if budget allows
                    if self.budget.can_attempt(attempt):
                        payload, mutator_name = mutate_payload(attack, attempt_number=attempt)
                        active_mutations.append(mutator_name)
                        last_payload = payload
                    else:
                        trial_trace_ids.append(tracer.trace_id)
                        break

            if trial_succeeded:
                trial_successes += 1
            mutations_applied.extend(active_mutations)

        success_rate = (trial_successes / trials) if trials > 0 else 0.0
        unique_invariants = list(dict.fromkeys(all_violated_invariants))
        unique_mutations = list(dict.fromkeys(mutations_applied))

        return AttackResult(
            attack_id=attack.id,
            name=attack.name,
            surface=attack.surface,
            payload=last_payload,
            mutations_used=unique_mutations,
            attempts_count=attempts_total,
            trials=trials,
            successes=trial_successes,
            success_rate=success_rate,
            violated_invariants=unique_invariants,
            what_leaked_or_abused="Invariants violated: " + ", ".join(unique_invariants) if unique_invariants else "None",
            severity=highest_severity if trial_successes > 0 else Severity.LOW,
            trace_ids=trial_trace_ids,
            active_defense=self.active_defense,
            model_adapter=self.model_adapter_type,
        )

    def run_campaign(
        self,
        attack_ids: Optional[List[str]] = None,
        trials: int = 1,
    ) -> List[AttackResult]:
        """Runs the entire attack library or a subset."""
        target_ids = attack_ids or list(ATTACK_LIBRARY.keys())
        results: List[AttackResult] = []

        for aid in target_ids:
            if aid in ATTACK_LIBRARY:
                attack_def = ATTACK_LIBRARY[aid]
                res = self.run_single_attack(attack_def, trials=trials)
                results.append(res)

        return results
