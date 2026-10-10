"""Tool Gateway (Pre-Execution Action Gateway) intercepting tool executions."""

import uuid
from typing import Any, Callable, Dict, List, Optional
from app.core.contracts import (
    Actor,
    EventType,
    PolicyDecision,
    Source,
)
from app.evaluator.tracer import TraceRecorder
from app.security.policy_engine import PolicyEngine
from app.tools.registry import TOOL_REGISTRY

class ToolGateway:
    def __init__(
        self,
        active_defense: str = "D0",
        policy_engine: Optional[PolicyEngine] = None,
        approval_oracle: Optional[Callable[[str, Dict[str, Any]], bool]] = None,
    ):
        self.active_defense = active_defense
        self.policy_engine = policy_engine or PolicyEngine(active_defense=active_defense)
        self.approval_oracle = approval_oracle
        # Store pending approvals for live UI resolution
        self.pending_approvals: Dict[str, Dict[str, Any]] = {}

    def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        tracer: TraceRecorder,
        is_tainted: bool = False,
        source: Optional[Source] = None,
        declared_tools: Optional[List[str]] = None,
        approval_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Intercepts tool invocation intent, logs to trace, evaluates policy, and executes only when permitted.
        GUARANTEE: If DENY or unapproved REQUIRE_APPROVAL, tool is never invoked.
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

        # Step 2: Evaluate Policy
        decision, reason = self.policy_engine.evaluate(
            tool_name=tool_name,
            arguments=arguments,
            is_tainted=is_tainted,
            declared_tools=declared_tools,
        )

        # Record policy evaluated
        tracer.record_step(
            actor=Actor.POLICY_ENGINE,
            event_type=EventType.POLICY_EVALUATED,
            policy_decision=decision,
            reason_code=reason,
            tool_name=tool_name,
            arguments=arguments,
        )

        # Step 3: Handle DENY (Hard Stop)
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

        # Step 4: Handle REQUIRE_APPROVAL
        if decision == PolicyDecision.REQUIRE_APPROVAL:
            tracer.record_step(
                actor=Actor.POLICY_ENGINE,
                event_type=EventType.APPROVAL_REQUESTED,
                policy_decision=decision,
                reason_code=reason,
                tool_name=tool_name,
                arguments=arguments,
            )

            # Check if automated approval oracle is configured (for evaluation runs)
            approved = False
            if self.approval_oracle:
                approved = self.approval_oracle(tool_name, arguments)
            elif approval_id and approval_id in self.pending_approvals:
                approved = self.pending_approvals[approval_id].get("approved", False)

            if not approved:
                gen_id = approval_id or str(uuid.uuid4())
                self.pending_approvals[gen_id] = {
                    "tool_name": tool_name,
                    "arguments": arguments,
                    "reason": reason,
                    "approved": False,
                }
                return {
                    "status": "pending_approval",
                    "decision": decision,
                    "reason": reason,
                    "approval_id": gen_id,
                    "message": f"Action paused: human approval required ({reason}).",
                }
            else:
                tracer.record_step(
                    actor=Actor.USER,
                    event_type=EventType.APPROVAL_RESOLVED,
                    policy_decision=PolicyDecision.ALLOW,
                    reason_code=f"APPROVED_{reason}",
                    tool_name=tool_name,
                    arguments=arguments,
                )

        # Step 5: Check tool registry & execute (Only on ALLOW or APPROVED)
        if tool_name not in TOOL_REGISTRY:
            tracer.record_step(
                actor=Actor.POLICY_ENGINE,
                event_type=EventType.TOOL_CALL_BLOCKED,
                policy_decision=PolicyDecision.DENY,
                reason_code="TOOL_NOT_FOUND",
                tool_name=tool_name,
                arguments=arguments,
            )
            return {
                "status": "error",
                "decision": PolicyDecision.DENY,
                "reason": "TOOL_NOT_FOUND",
                "message": f"Tool '{tool_name}' not implemented.",
            }

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
