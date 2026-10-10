"""Exact Replay Engine reproducing recorded traces against upgraded defense layers without API calls."""

from typing import Any, Dict, List, Optional
from app.core.contracts import Actor, EventType, TraceStep
from app.evaluator.judge import Judge, JudgeVerdict
from app.evaluator.tracer import TraceRecorder
from app.security.gateway import ToolGateway

class ExactReplayEngine:
    @staticmethod
    def replay_trace(
        original_trace_id: str,
        target_defense: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Replays a recorded trace using cached model outputs from each step.
        Guarantees ZERO model calls are made (zero token spend / zero quota).
        If target_defense is specified, evaluates the exact proposed tools under the new defense.
        """
        original_trace = TraceRecorder.load(original_trace_id)
        if not original_trace:
            raise ValueError(f"Trace '{original_trace_id}' not found on disk.")

        defense_to_use = target_defense or original_trace.get("active_defense", "D0")
        replay_tracer = TraceRecorder(
            active_defense=defense_to_use,
            model_adapter=f"cached_replay:{original_trace.get('model_adapter', 'mock')}",
        )
        gateway = ToolGateway(active_defense=defense_to_use)

        original_steps = original_trace.get("steps", [])
        
        # Step-by-step replay using cached inputs, outputs, and proposals
        for step in original_steps:
            event_type = step.get("event_type")

            if event_type == "user_input_received":
                replay_tracer.record_step(
                    actor=Actor.USER,
                    event_type=EventType.USER_INPUT_RECEIVED,
                    source=step.get("source"),
                    input=step.get("input"),
                )

            elif event_type == "retrieval_completed":
                replay_tracer.record_step(
                    actor=Actor.AGENT,
                    event_type=EventType.RETRIEVAL_COMPLETED,
                    source=step.get("source"),
                    tainted=step.get("tainted"),
                    input=step.get("input"),
                )

            elif event_type == "model_proposed":
                # Replay cached model output with ZERO model calls
                replay_tracer.record_step(
                    actor=Actor.AGENT,
                    event_type=EventType.MODEL_PROPOSED,
                    model_output=step.get("model_output"),
                    tainted=step.get("tainted"),
                )

            elif event_type == "tool_call_proposed":
                tool_name = step.get("tool_name")
                arguments = step.get("arguments", {})
                is_tainted = step.get("tainted", False)

                # Route the cached tool proposal through the ToolGateway under the target defense
                exec_res = gateway.execute_tool(
                    tool_name=tool_name,
                    arguments=arguments,
                    tracer=replay_tracer,
                    is_tainted=is_tainted,
                )

        replay_tracer.record_step(
            actor=Actor.AGENT,
            event_type=EventType.RUN_FINISHED,
            input="Exact replay completed using cached model outputs.",
        )
        replay_trace_path = replay_tracer.save()

        # Score the replayed trace
        judge = Judge()
        verdict: JudgeVerdict = judge.evaluate_trace(replay_tracer.steps)

        return {
            "status": "success",
            "original_trace_id": original_trace_id,
            "replay_trace_id": replay_tracer.trace_id,
            "target_defense": defense_to_use,
            "model_calls_made": 0,  # Zero model calls guaranteed!
            "total_steps": len(replay_tracer.steps),
            "verdict": verdict.model_dump(),
        }
