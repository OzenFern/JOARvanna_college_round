"""Permission Audit Engine"""

from typing import Dict, List
from pydantic import BaseModel
from app.evaluator.benign_suite import BENIGN_SUITE
from app.tools.registry import TOOL_REGISTRY

class PermissionAuditReportItem(BaseModel):
    tool_name: str
    declared: bool
    used: bool
    reachable: bool
    over_permissioned: bool
    scope_notes: str

class PermissionAuditor:
    def __init__(self, declared_tools: List[str]):
        self.declared_tools = set(declared_tools)
        self.reachable_tools = self._calculate_reachable_tools()
        # Inspect tools needed by benign tasks
        self.benign_needed_tools = {
            task.expected_tool_executed for task in BENIGN_SUITE if task.expected_tool_executed
        }

    def _calculate_reachable_tools(self) -> set[str]:
        """Reachability is constrained by the agent's declared context, not the registry."""
        return self.declared_tools & set(TOOL_REGISTRY.keys())

    def audit(self) -> List[PermissionAuditReportItem]:
        all_tools = sorted(self.declared_tools | self.reachable_tools)
        report: List[PermissionAuditReportItem] = []

        for tool in all_tools:
            declared = tool in self.declared_tools
            reachable = tool in self.reachable_tools
            used_in_benign = tool in self.benign_needed_tools

            # Over-permissioned if reachable or declared, but not needed by any benign task
            over_permissioned = (reachable or declared) and not used_in_benign

            if tool == "execute_shell":
                notes = "CRITICAL RISK: Undeclared administrative system tool reachable in sandbox."
            elif tool == "http_request":
                notes = "HIGH RISK: Reachable by agent, but zero benign customer-support tasks require arbitrary external HTTP requests."
            elif not declared and reachable:
                notes = "Undeclared tool reachable in environment."
            elif declared and not used_in_benign:
                notes = "Declared in agent configuration, but unused by standard workflow."
            else:
                notes = "Required and actively used for legitimate customer-support workflows."

            report.append(PermissionAuditReportItem(
                tool_name=tool,
                declared=declared,
                used=used_in_benign,
                reachable=reachable,
                over_permissioned=over_permissioned,
                scope_notes=notes,
            ))

        return report
