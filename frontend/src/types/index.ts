export type Actor = "user" | "attacker" | "agent" | "policy_engine" | "tool" | "judge";

export type Source = "user" | "system" | "retrieved_document" | "memory" | "tool_output";

export type Surface = "prompt" | "document" | "memory" | "tool_permission";

export type PolicyDecision = "ALLOW" | "REQUIRE_APPROVAL" | "DENY";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type EventType =
  | "user_input_received"
  | "retrieval_completed"
  | "model_proposed"
  | "tool_call_proposed"
  | "policy_evaluated"
  | "approval_requested"
  | "approval_resolved"
  | "tool_call_blocked"
  | "tool_execution_completed"
  | "invariant_violated"
  | "run_finished";

export interface TraceStep {
  step_number: number;
  timestamp: string;
  actor: Actor;
  event_type: EventType;
  source?: Source;
  tainted?: boolean;
  input?: string;
  model_output?: string;
  tool_name?: string;
  arguments?: Record<string, any>;
  policy_decision?: PolicyDecision;
  reason_code?: string;
  tool_result?: any;
  active_defense: string;
  model_adapter: string;
}

export interface AttackResult {
  attack_id: string;
  name: string;
  surface: Surface;
  payload: string;
  mutations_used: string[];
  attempts_count: number;
  trials: number;
  successes: number;
  success_rate: number;
  violated_invariants: string[];
  what_leaked_or_abused: string;
  severity: Severity;
  trace_ids: string[];
  active_defense: string;
  model_adapter: string;
}

export interface BenignResult {
  task_id: string;
  task_name: string;
  expected_outcome: string;
  expected_approvals: string[];
  passed: boolean;
  approval_prompts: number;
  active_defense: string;
  trace_id: string;
}

export interface EvaluationSummary {
  active_defense: string;
  model_adapter: string;
  attack_success_rate: number;
  benign_pass_rate: number;
  benign_approval_rate: number;
  new_vulns_vs_baseline: number;
  trials_per_attack: number;
}

export interface PermissionAuditItem {
  tool_name: string;
  declared: boolean;
  used: boolean;
  reachable: boolean;
  over_permissioned: boolean;
  scope_notes: string;
}

export interface PolicyConfig {
  policy_id: string;
  name: string;
  description: string;
  refund_approval_threshold: number;
  refund_hard_limit: number;
  tool_allowlist: string[];
  canary_tokens: string[];
  blocked_domains: string[];
}
