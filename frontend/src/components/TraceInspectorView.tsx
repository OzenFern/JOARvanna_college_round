"use client";

import React, { useState } from "react";
import { RotateCcw, ShieldCheck, AlertTriangle, Tag, Layers } from "lucide-react";
import { AttackResult, TraceStep } from "@/types";
import { api } from "@/lib/api";

interface TraceInspectorViewProps {
  findings: AttackResult[];
}

<<<<<<< HEAD
<<<<<<< HEAD
export default function TraceInspectorView({ findings }: TraceInspectorViewProps) {
  const [selectedAttack, setSelectedAttack] = useState<AttackResult | null>(
    findings.length > 0 ? findings[0] : null
  );
  const [selectedTraceSteps, setSelectedTraceSteps] = useState<TraceStep[]>([]);
  const [loadingTrace, setLoadingTrace] = useState<boolean>(false);
  const [replayLoading, setReplayLoading] = useState<boolean>(false);
  const [replayResult, setReplayResult] = useState<{
    status: string;
    original_trace_id: string;
    replay_trace_id: string;
    target_defense: string;
    model_calls_made: number;
    total_steps: number;
    verdict: {
      success: boolean;
      violated_invariants: string[];
      severity: string | null;
    };
  } | null>(null);
=======
=======
>>>>>>> 209fc3cc0aa9b94ede18db9929ba5355864af788
const EVENT_STYLE: Record<string, React.CSSProperties> = {
  invariant_violated:     { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" },
  tool_call_blocked:      { background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.20)" },
  tool_execution_completed: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" },
};
<<<<<<< HEAD
>>>>>>> 209fc3cc0aa9b94ede18db9929ba5355864af788
=======
>>>>>>> 209fc3cc0aa9b94ede18db9929ba5355864af788

const DEFAULT_EVENT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
};

export default function TraceInspectorView({ findings }: TraceInspectorViewProps) {
  const [selected,      setSelected]      = useState<AttackResult | null>(findings[0] ?? null);
  const [steps,         setSteps]         = useState<TraceStep[]>([]);
  const [loadingTrace,  setLoadingTrace]  = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayResult,  setReplayResult]  = useState<any>(null);
  const [replayError,   setReplayError]   = useState<string | null>(null);

  const handleSelect = async (atk: AttackResult) => {
    setSelected(atk);
    setReplayResult(null);
    setReplayError(null);
    if (atk.trace_ids?.length) {
      setLoadingTrace(true);
      try {
        const data = await api.getTrace(atk.trace_ids[0]);
        setSteps((data as any).steps || []);
      } catch {
        setSteps([]);
      } finally {
        setLoadingTrace(false);
      }
    } else {
      setSteps([]);
    }
  };

  const handleReplay = async () => {
    const traceId = selected?.trace_ids?.[0];
    if (!traceId) return;
    setReplayLoading(true);
    setReplayError(null);
    try {
      const res = await api.replayTrace(traceId);
      setReplayResult(res);
    } catch (err: any) {
      setReplayError(err.message || "Replay failed.");
    } finally {
      setReplayLoading(false);
    }
  };

  return (
    <div className="space-y-5 fade-in">

      {/* ── Header Banner ── */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Causal Trace Inspector &amp; Exact Replay
              </h1>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
                Zero Model Calls
              </span>
            </div>
            <p className="text-xs mt-1.5 max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Every agent execution produces a causal trace linking inputs, tainted context, proposed
              tool actions, policy decisions, and invariant violations. Replay any exploit trace against
              hardened defenses with <strong className="text-white">zero model calls</strong>.
            </p>
          </div>

          {selected && (
            <button
              onClick={handleReplay}
              disabled={replayLoading || !selected.trace_ids?.length}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium text-white transition disabled:opacity-45"
              style={{ background: "#059669", boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
              onMouseEnter={e => !replayLoading && (e.currentTarget.style.background = "#10B981")}
              onMouseLeave={e => !replayLoading && (e.currentTarget.style.background = "#059669")}
            >
              {replayLoading
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <RotateCcw className="w-3.5 h-3.5" />
              }
              <span>Replay vs Hardened (D1+D2+D3)</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Two Column Inspector ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── Left: Attack List ── */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Captured Attack Traces
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              {findings.length} findings
            </span>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {findings.length === 0 && (
              <div className="p-4 rounded-xl text-center text-[11px] font-mono" style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                No findings yet. Run a campaign first.
              </div>
            )}
            {findings.map(item => {
              const isActive  = selected?.attack_id === item.attack_id;
              const isExploit = item.successes > 0;
              return (
                <div
                  key={item.attack_id}
                  onClick={() => handleSelect(item)}
                  className="p-3.5 rounded-xl cursor-pointer transition"
                  style={{
                    background: isActive ? "var(--bg-muted)" : "var(--bg-elevated)",
                    border: isActive ? "1px solid rgba(239,68,68,0.40)" : "1px solid var(--border-subtle)",
                    boxShadow: isActive ? "0 0 0 1px rgba(239,68,68,0.10)" : "none",
                  }}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.borderColor = "var(--border-default)")}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {item.attack_id}
                      </span>
                      <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded"
                        style={isExploit
                          ? { background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.22)" }
                          : { background: "rgba(16,185,129,0.10)", color: "#6EE7B7", border: "1px solid rgba(16,185,129,0.20)" }
                        }>
                        {isExploit ? "Exploited" : "Defended"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                      {item.violated_invariants?.[0] || "None"}
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-1 mb-2" style={{ color: "var(--text-secondary)" }}>{item.name}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2"
                    style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                    <span>Severity: <span className={
                      item.severity === "CRITICAL" ? "text-red-400" :
                      item.severity === "HIGH" ? "text-amber-400" : ""
                    }>{item.severity}</span></span>
                    <span>Surface: {item.surface}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Step Timeline ── */}
        <div className="lg:col-span-8">
          {selected ? (
            <div className="rounded-2xl p-5 space-y-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>

              {/* Finding Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selected.name}</h2>
                    <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>({selected.attack_id})</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {selected.what_leaked_or_abused || "Simulated multi-turn autonomous interaction sequence."}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono mb-0.5" style={{ color: "var(--text-muted)" }}>Trace ID</div>
                  <div className="text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>
                    {selected.trace_ids?.[0]?.slice(0, 16) ?? "Pending"}...
                  </div>
                </div>
              </div>

              {/* Replay Error */}
              {replayError && (
                <div className="rounded-xl px-4 py-3 text-xs font-mono flex items-center gap-2"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {replayError}
                </div>
              )}

              {/* Replay Result */}
              {replayResult && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-mono font-semibold">
                      <ShieldCheck className="w-4 h-4" />
<<<<<<< HEAD
<<<<<<< HEAD
                      <span>EXACT REPLAY VERIFICATION: {replayResult.model_calls_made} Model Calls Used</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                      replayResult.verdict.success
                        ? "bg-red-900/60 text-red-300 border-red-700/50"
                        : "bg-emerald-900/60 text-emerald-300 border-emerald-700/50"
                    }`}>
                      {replayResult.verdict.success ? "Still Vulnerable" : "Attack Neutralized"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-[#0E111A] p-2.5 rounded border border-zinc-800">
                      <div className="text-zinc-500 text-[10px]">Replay Steps</div>
                      <div className="text-zinc-200 font-bold mt-0.5">{replayResult.total_steps} total</div>
                    </div>
                    <div className="bg-[#0E111A] p-2.5 rounded border border-zinc-800">
                      <div className="text-zinc-500 text-[10px]">Invariants Violated</div>
                      <div className={`font-bold mt-0.5 ${replayResult.verdict.violated_invariants.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {replayResult.verdict.violated_invariants.length > 0
                          ? replayResult.verdict.violated_invariants.join(", ")
                          : "None"}
                      </div>
                    </div>
                    <div className="bg-[#0E111A] p-2.5 rounded border border-zinc-800">
                      <div className="text-zinc-500 text-[10px]">Policy Gate Status</div>
                      <div className="text-emerald-400 font-bold mt-0.5">{replayResult.target_defense} Enforced</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    The tool invocations that succeeded in baseline were deterministically re-evaluated against the hardened policy engine. Zero new model calls were made.
=======
                      EXACT REPLAY VERIFICATION — Zero Model Calls
                    </div>
                    <span className="font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded"
                      style={replayResult.exploit_prevented
                        ? { background: "rgba(16,185,129,0.12)", color: "#6EE7B7", border: "1px solid rgba(16,185,129,0.25)" }
                        : { background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.22)" }
                      }>
                      {replayResult.exploit_prevented ? "Attack Neutralized" : "Vulnerable"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[11px] font-mono">
                    {[
                      { label: "Baseline Actions", value: `${replayResult.original_action_count} proposed`, color: "var(--text-primary)" },
                      { label: "Actions Blocked", value: `${replayResult.blocked_count} halted`, color: "#FCA5A5" },
                      { label: "Gate Status",      value: "D1+D2+D3",                              color: "#6EE7B7" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                        <div className="text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
                        <div className="font-bold" style={{ color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    Tool invocations that succeeded in baseline were deterministically re-evaluated
                    against the hardened policy engine. All unauthorized actions were intercepted before execution.
>>>>>>> 209fc3cc0aa9b94ede18db9929ba5355864af788
=======
                      EXACT REPLAY VERIFICATION — Zero Model Calls
                    </div>
                    <span className="font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded"
                      style={replayResult.exploit_prevented
                        ? { background: "rgba(16,185,129,0.12)", color: "#6EE7B7", border: "1px solid rgba(16,185,129,0.25)" }
                        : { background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.22)" }
                      }>
                      {replayResult.exploit_prevented ? "Attack Neutralized" : "Vulnerable"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[11px] font-mono">
                    {[
                      { label: "Baseline Actions", value: `${replayResult.original_action_count} proposed`, color: "var(--text-primary)" },
                      { label: "Actions Blocked", value: `${replayResult.blocked_count} halted`, color: "#FCA5A5" },
                      { label: "Gate Status",      value: "D1+D2+D3",                              color: "#6EE7B7" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
                        <div className="text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
                        <div className="font-bold" style={{ color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    Tool invocations that succeeded in baseline were deterministically re-evaluated
                    against the hardened policy engine. All unauthorized actions were intercepted before execution.
>>>>>>> 209fc3cc0aa9b94ede18db9929ba5355864af788
                  </p>
                </div>
              )}

              {/* Step Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Execution Timeline</span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{steps.length} events</span>
                </div>

                {loadingTrace ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="skeleton h-16 rounded-xl" />
                    ))}
                  </div>
                ) : steps.length > 0 ? (
                  <div className="space-y-2">
                    {steps.map((step, idx) => (
                      <div key={idx} className="rounded-xl p-3.5 space-y-2 text-xs"
                        style={EVENT_STYLE[step.event_type] ?? DEFAULT_EVENT_STYLE}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                              #{step.step_number}
                            </span>
                            <span className="font-mono font-semibold text-[11px]" style={{ color: "var(--text-primary)" }}>
                              {step.event_type}
                            </span>
                            {step.tainted && (
                              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.22)" }}>
                                <Tag className="w-2.5 h-2.5" /> TAINTED
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Actor: {step.actor}</span>
                        </div>

                        {step.tool_name && (
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span style={{ color: "var(--text-muted)" }}>Tool:</span>
                            <span className="text-blue-400 font-semibold">{step.tool_name}</span>
                          </div>
                        )}

                        {step.arguments && Object.keys(step.arguments).length > 0 && (
                          <div className="rounded-lg p-2.5 overflow-x-auto font-mono text-[10px]"
                            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)" }}>
                            <span className="block mb-1" style={{ color: "var(--text-muted)" }}>Arguments:</span>
                            <pre style={{ color: "var(--text-secondary)", margin: 0 }}>{JSON.stringify(step.arguments, null, 2)}</pre>
                          </div>
                        )}

                        {step.policy_decision && (
                          <div className="flex items-center gap-2 font-mono text-[10px]">
                            <span style={{ color: "var(--text-muted)" }}>Policy Decision:</span>
                            <span className={
                              step.policy_decision === "DENY"  ? "text-red-400 font-semibold" :
                              step.policy_decision === "ALLOW" ? "text-emerald-400 font-semibold" : "text-amber-400"
                            }>{step.policy_decision}</span>
                            {step.reason_code && (
                              <span style={{ color: "var(--text-muted)" }}>({step.reason_code})</span>
                            )}
                          </div>
                        )}

                        {step.tool_result && (
                          <div className="rounded-lg p-2 font-mono text-[10px]"
                            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)" }}>
                            <span className="block mb-0.5" style={{ color: "var(--text-muted)" }}>Tool Result:</span>
                            <pre style={{ color: "var(--text-secondary)", margin: 0 }}>{JSON.stringify(step.tool_result, null, 2)}</pre>
                          </div>
                        )}

                        {step.model_output && (
                          <div className="rounded-lg p-2 text-[11px]" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-subtle)" }}>
                            <span className="block text-[10px] font-mono mb-1" style={{ color: "var(--text-muted)" }}>Model Output:</span>
                            <span style={{ color: "var(--text-secondary)" }}>{step.model_output}</span>
                          </div>
                        )}

                        {step.input && (
                          <div className="rounded-lg p-2 text-[11px]" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-subtle)" }}>
                            <span className="block text-[10px] font-mono mb-1" style={{ color: "var(--text-muted)" }}>Input Received:</span>
                            <span style={{ color: "var(--text-secondary)" }}>{step.input}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-[11px] font-mono rounded-xl" style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                    Click an attack on the left to inspect its causal trace.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl py-16 text-center text-[12px] font-mono"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
              No attack traces captured yet. Run a campaign to inspect execution graphs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
