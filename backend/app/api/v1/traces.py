"""API Endpoints for Traces and Exact Replay."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.evaluator.replay import ExactReplayEngine
from app.evaluator.tracer import TraceRecorder

router = APIRouter(prefix="/traces", tags=["traces"])

class ReplayRequest(BaseModel):
    target_defense: Optional[str] = None

@router.get("/{trace_id}")
def get_trace(trace_id: str):
    trace_data = TraceRecorder.load(trace_id)
    if not trace_data:
        raise HTTPException(status_code=404, detail=f"Trace '{trace_id}' not found.")
    return trace_data

@router.post("/{trace_id}/replay")
def replay_trace(trace_id: str, request: ReplayRequest = ReplayRequest()):
    try:
        result = ExactReplayEngine.replay_trace(
            original_trace_id=trace_id,
            target_defense=request.target_defense,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
