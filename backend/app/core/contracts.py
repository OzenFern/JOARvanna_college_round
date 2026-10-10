from enum import Enum
from typing import Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class Actor(str, Enum):
    USER = "user"
    ATTACKER = "attacker"
    AGENT = "agent"
    POLICY_ENGINE = "policy_engine"
    TOOL = "tool"
    JUDGE = "judge"

class Source(str, Enum):
    USER = "user"
    SYSTEM = "system"
    RETRIEVED_DOCUMENT = "retrieved_document"
    MEMORY = "memory"
    TOOL_OUTPUT = "tool_output"

class Surface(str, Enum):
    PROMPT = "prompt"
    DOCUMENT = "document"
    MEMORY = "memory"
    TOOL_PERMISSION = "tool_permission"

class PolicyDecision(str, Enum):
    ALLOW = "ALLOW"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    DENY = "DENY"

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class EventType(str, Enum):
    USER_INPUT_RECEIVED = "user_input_received"
    RETRIEVAL_COMPLETED = "retrieval_completed"
    MODEL_PROPOSED = "model_proposed"
    TOOL_CALL_PROPOSED = "tool_call_proposed"
    POLICY_EVALUATED = "policy_evaluated"
    APPROVAL_REQUESTED = "approval_requested"
    APPROVAL_RESOLVED = "approval_resolved"
    TOOL_CALL_BLOCKED = "tool_call_blocked"
    TOOL_EXECUTION_COMPLETED = "tool_execution_completed"
    INVARIANT_VIOLATED = "invariant_violated"
    RUN_FINISHED = "run_finished"

class TraceStep(BaseModel):
    step_number: int
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    actor: Actor
    event_type: EventType
    source: Optional[Source] = None
    tainted: Optional[bool] = None
    input: Optional[str] = None
    model_output: Optional[str] = None
    tool_name: Optional[str] = None
    arguments: Optional[dict[str, Any]] = None
    policy_decision: Optional[PolicyDecision] = None
    reason_code: Optional[str] = None
    tool_result: Optional[Any] = None
    active_defense: str = "D0"
    model_adapter: str = "mock"

class AttackResult(BaseModel):
    attack_id: str
    name: str
    surface: Surface
    payload: str
    mutations_used: list[str] = Field(default_factory=list)
    attempts_count: int = 1
    trials: int = 1
    successes: int = 0
    success_rate: float = 0.0
    violated_invariants: list[str] = Field(default_factory=list)
    what_leaked_or_abused: str = ""
    severity: Severity = Severity.LOW
    trace_ids: list[str] = Field(default_factory=list)
    active_defense: str = "D0"
    model_adapter: str = "mock"

class BenignResult(BaseModel):
    task_id: str
    task_name: str
    expected_outcome: str
    expected_approvals: list[str] = Field(default_factory=list)
    passed: bool
    approval_prompts: int = 0
    active_defense: str = "D0"
    trace_id: str

class EvaluationSummary(BaseModel):
    active_defense: str
    model_adapter: str
    attack_success_rate: float
    benign_pass_rate: float
    benign_approval_rate: float
    new_vulns_vs_baseline: int
    trials_per_attack: int
