"""Trace recorder and persistence engine per PRD Section 7.2 & 10.4."""

import json
import uuid
from pathlib import Path
from typing import Any, Optional
from datetime import datetime, timezone

from app.core.config import settings
from app.core.contracts import (
    Actor,
    EventType,
    PolicyDecision,
    Source,
    TraceStep,
)

class TraceRecorder:
    def __init__(self, run_id: Optional[str] = None, active_defense: str = "D0", model_adapter: str = "mock"):
        self.trace_id = run_id or str(uuid.uuid4())
        self.active_defense = active_defense
        self.model_adapter = model_adapter
        self.steps: list[TraceStep] = []
        self._step_counter = 0

    def record_step(
        self,
        actor: Actor,
        event_type: EventType,
        source: Optional[Source] = None,
        tainted: Optional[bool] = None,
        input: Optional[str] = None,
        model_output: Optional[str] = None,
        tool_name: Optional[str] = None,
        arguments: Optional[dict[str, Any]] = None,
        policy_decision: Optional[PolicyDecision] = None,
        reason_code: Optional[str] = None,
        tool_result: Optional[Any] = None,
    ) -> TraceStep:
        """Appends a new atomic step to the run's causal trace."""
        self._step_counter += 1
        step = TraceStep(
            step_number=self._step_counter,
            timestamp=datetime.now(timezone.utc).isoformat(),
            actor=actor,
            event_type=event_type,
            source=source,
            tainted=tainted,
            input=input,
            model_output=model_output,
            tool_name=tool_name,
            arguments=arguments,
            policy_decision=policy_decision,
            reason_code=reason_code,
            tool_result=tool_result,
            active_defense=self.active_defense,
            model_adapter=self.model_adapter,
        )
        self.steps.append(step)
        return step

    def save(self) -> Path:
        """Saves the trace as a structured JSON file under data/traces/."""
        trace_file = settings.TRACES_DIR / f"{self.trace_id}.json"
        data = {
            "trace_id": self.trace_id,
            "active_defense": self.active_defense,
            "model_adapter": self.model_adapter,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "total_steps": len(self.steps),
            "steps": [step.model_dump() for step in self.steps],
        }
        trace_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return trace_file

    @classmethod
    def load(cls, trace_id: str) -> Optional[dict]:
        """Loads a recorded trace JSON from disk."""
        trace_file = settings.TRACES_DIR / f"{trace_id}.json"
        if not trace_file.exists():
            return None
        return json.loads(trace_file.read_text(encoding="utf-8"))
