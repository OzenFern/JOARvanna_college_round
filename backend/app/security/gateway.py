"""Tool Gateway (Pre-Execution Action Gateway) per PRD Section 6."""

from typing import Any, Dict, Optional, Tuple
from app.core.contracts import (
    Actor,
    EventType,
    PolicyDecision,
    Source,
)
from app.evaluator.tracer import TraceRecorder
from app.tools.registry import TOOL_REGISTRY

class ToolGateway:
    def __init__(self, active_defense: str = "D0"):
        self.active_defense = active_defense

    def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        tracer: TraceRecorder,
        is_tainted: bool = False,
        source: Optional[Source] = None,
        policy_override: Optional[Tuple[PolicyDecision, str]] = None,
    ) -> Dict[str, Any]:
        """
        Intercepts tool invocation intent, logs to trace, checks policy, and executes only when allowed.
        In D0 (Baseline), no code policies are enforced (everything declared is permitted).
        """
        # Step 1: Record tool call proposed
        tracer.record_step(
            actor=Actor.AGENT,
            event_type=EventType.TOOL_CALL_PROPOSED,
            source=source,
            tainted=is_tainted,
            tool_name=tool_name,
            arguments=arguments,
        )

        # Check if tool is in registry
        if tool_name not in TOOL_REGISTRY:
            decision = PolicyDecision.DENY
            reason = "TOOL_NOT_ALLOWLISTED"
            tracer.record_step(
                actor=Actor.POLICY_ENGINE,
                event_type=EventType.TOOL_CALL_BLOCKED,
                policy_decision=decision,
                reason_code=reason,
                tool_name=tool_name,
                arguments=arguments,
            )
            return {"status": "error", "decision": decision, "reason": reason, "message": f"Tool '{tool_name}' is not recognized."}

        # Step 2: Policy Decision
        if policy_override:
            decision, reason = policy_override
        elif self.active_defense == "D0":
            # Baseline: prompt-only rules, application code allows everything
            decision = PolicyDecision.ALLOW
            reason = "BASELINE_UNRESTRICTED"
        else:
            decision = PolicyDecision.ALLOW
            reason = "WITHIN_SCOPE"

        # Record policy decision
        tracer.record_step(
            actor=Actor.POLICY_ENGINE,
            event_type=EventType.POLICY_EVALUATED,
            policy_decision=decision,
            reason_code=reason,
            tool_name=tool_name,
            arguments=arguments,
        )

        # Step 3: Handle Blocked Decision
        if decision == PolicyDecision.DENY:
            tracer.record_step(
                actor=Actor.POLICY_ENGINE,
                event_type=EventType.TOOL_CALL_BLOCKED,
                policy_decision=decision,
                reason_code=reason,
                tool_name=tool_name,
                arguments=arguments,
            )
            return {
                "status": "blocked",
                "decision": decision,
                "reason": reason,
                "message": f"Action blocked by policy: {reason}",
            }

        if decision == PolicyDecision.REQUIRE_APPROVAL:
            tracer.record_step(
                actor=Actor.POLICY_ENGINE,
                event_type=EventType.APPROVAL_REQUESTED,
                policy_decision=decision,
                reason_code=reason,
                tool_name=tool_name,
                arguments=arguments,
            )
            return {
                "status": "pending_approval",
                "decision": decision,
                "reason": reason,
                "message": f"Action requires human approval: {reason}",
            }

        # Step 4: Execute Mock Tool (Only on ALLOW)
        tool_fn = TOOL_REGISTRY[tool_name]
        try:
            tool_result = tool_fn(**arguments)
            tracer.record_step(
                actor=Actor.TOOL,
                event_type=EventType.TOOL_EXECUTION_COMPLETED,
                tool_name=tool_name,
                arguments=arguments,
                tool_result=tool_result,
            )
            return {
                "status": "success",
                "decision": PolicyDecision.ALLOW,
                "result": tool_result,
            }
        except TypeError as e:
            tracer.record_step(
                actor=Actor.POLICY_ENGINE,
                event_type=EventType.TOOL_CALL_BLOCKED,
                policy_decision=PolicyDecision.DENY,
                reason_code="INVALID_ARGUMENTS",
                tool_name=tool_name,
                arguments=arguments,
            )
            return {
                "status": "error",
                "decision": PolicyDecision.DENY,
                "reason": "INVALID_ARGUMENTS",
                "message": f"Invalid arguments for {tool_name}: {str(e)}",
            }
