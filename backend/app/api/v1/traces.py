"""API Endpoints for Traces and Exact Replay per PRD Section 10.4 & 12.4."""

from fastapi import APIRouter, HTTPException
from app.evaluator.tracer import TraceRecorder

router = APIRouter(prefix="/traces", tags=["traces"])

@router.get("/{trace_id}")
def get_trace(trace_id: str):
    trace_data = TraceRecorder.load(trace_id)
    if not trace_data:
        raise HTTPException(status_code=404, detail=f"Trace '{trace_id}' not found.")
    return trace_data

@router.post("/{trace_id}/replay")
def replay_trace(trace_id: str):
    trace_data = TraceRecorder.load(trace_id)
    if not trace_data:
        raise HTTPException(status_code=404, detail=f"Trace '{trace_id}' not found.")
    
    # Exact replay returns cached steps with zero model quota spent
    return {
        "status": "replayed",
        "original_trace_id": trace_id,
        "replay_id": f"replay_{trace_id}",
        "steps": trace_data.get("steps", []),
    }
