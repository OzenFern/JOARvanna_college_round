"""API Endpoints for Evaluations per PRD Section 12.4."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.contracts import EvaluationSummary
from app.evaluator.evaluation_runner import EvaluationRunner

router = APIRouter(prefix="/evaluations", tags=["evaluations"])

class EvaluationRunRequest(BaseModel):
    defenses: Optional[List[str]] = None
    attacks: Optional[List[str]] = None
    trials: int = 1

class EvaluationRunResponse(BaseModel):
    evaluation_id: str
    summaries: List[EvaluationSummary]

@router.post("/run", response_model=EvaluationRunResponse)
def run_evaluation_matrix(request: EvaluationRunRequest = EvaluationRunRequest()):
    runner = EvaluationRunner(trials_per_attack=request.trials)
    result = runner.run_matrix(
        defenses=request.defenses,
        attack_ids=request.attacks,
    )
    return result

@router.get("/{evaluation_id}", response_model=List[EvaluationSummary])
def get_evaluation(evaluation_id: str):
    summaries = EvaluationRunner.get_evaluation(evaluation_id)
    if not summaries:
        raise HTTPException(status_code=404, detail="Evaluation run not found.")
    return summaries
