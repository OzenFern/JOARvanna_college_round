"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Code,
  FileText,
} from "lucide-react";
import { AttackResult, TraceStep } from "@/types";
import { api } from "@/lib/api";

interface TraceInspectorViewProps {
  findings: AttackResult[];
  onReplaySuccess?: () => void;
}

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

  // Fetch full trace when selecting an attack
  const handleSelectAttack = async (atk: AttackResult) => {
    setSelectedAttack(atk);
    setReplayResult(null);
    if (atk.trace_ids && atk.trace_ids.length > 0) {
      setLoadingTrace(true);
      try {
        const traceData = await api.getTrace(atk.trace_ids[0]);
        setSelectedTraceSteps((traceData as any).steps || []);
      } catch (err) {
        setSelectedTraceSteps([]);
      } finally {
        setLoadingTrace(false);
      }
    } else {
      setSelectedTraceSteps([]);
    }
  };

  const handleRunReplay = async (targetDefense: string = "D1+D2+D3") => {
    const traceId = selectedAttack?.trace_ids?.[0];
    if (!traceId) return;
    setReplayLoading(true);
    try {
      const res = await api.replayTrace(traceId);
      setReplayResult(res as any);
    } catch (err: any) {
      alert(`Replay failed: ${err.message}`);
    } finally {
      setReplayLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Heading ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="label mb-1 text-[#ee7b30]">Causal Trace Graph</div>
          <h1 className="h1">Trace run &amp; test exact replay</h1>
          <p className="muted text-xs mt-1 max-w-xl">
            Inspect the step where the model proposed an unauthorized side effect, then test if hardened software policy halts it with <strong>zero model calls</strong>.
          </p>
        </div>

        {selectedAttack && (
          <button
            onClick={() => handleRunReplay("D1+D2+D3")}
            disabled={replayLoading || !selectedAttack.trace_ids?.length}
            className="btn btn-sm btn-primary self-start sm:self-auto"
          >
            {replayLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCcw className="w-3 h-3" />
            )}
            <span>Replay against Hardened (D1+D2+D3)</span>
          </button>
        )}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Attack Traces List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="label">Recorded Traces</span>
            <span className="font-mono text-[11px] text-[#8a8c97]">{findings.length} findings</span>
          </div>

          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {findings.map((item) => {
              const isSelected = selectedAttack?.attack_id === item.attack_id;
              const isExploit = item.successes > 0;
              return (
                <div
                  key={item.attack_id}
                  onClick={() => handleSelectAttack(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                    isSelected
                      ? "bg-white border-[#ee7b30] shadow-sm"
                      : "bg-[#fbfbfa] border-[#e9e8e4] hover:bg-white hover:border-[#d9d8d3]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-semibold text-[#1c1e2b]">
                      {item.attack_id}
                    </span>
                    <span className={`badge ${isExploit ? "badge-fail" : "badge-pass"}`}>
                      {isExploit ? "Exploited" : "Defended"}
                    </span>
                  </div>

                  <p className="text-xs text-[#5a5d6b] line-clamp-1">
                    {item.name}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#f0f0ed] text-[11px] font-mono text-[#8a8c97]">
                    <span>Severity: <strong className={item.severity === "CRITICAL" ? "text-[#b83a32]" : "text-[#1c1e2b]"}>{item.severity}</strong></span>
                    <span>{item.surface}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Step Timeline & Exact Replay Panel */}
        <div className="lg:col-span-8 space-y-4">
          {selectedAttack ? (
            <div className="card card-pad bg-white space-y-5">
              
              {/* Attack Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#e9e8e4]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-[#1c1e2b]">{selectedAttack.name}</h2>
                    <span className="font-mono text-xs text-[#8a8c97]">({selectedAttack.attack_id})</span>
                  </div>
                  <p className="text-xs text-[#5a5d6b] mt-1">
                    {selectedAttack.what_leaked_or_abused || "Simulated multi-turn autonomous interaction sequence."}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="label text-[10px]">Trace ID</div>
                  <div className="font-mono text-xs text-[#1c1e2b]">
                    {selectedAttack.trace_ids?.[0]?.slice(0, 14) || "Pending"}...
                  </div>
                </div>
              </div>

              {/* Exact Replay Verification Box (Clean Light Banner) */}
              {replayResult && (
                <div className="rounded-xl border border-[#2e6a4f]/30 bg-[#e9f3ed] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#2e6a4f] text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>EXACT REPLAY VERIFICATION: {replayResult.model_calls_made} Model Calls Used</span>
                    </div>
                    <span className={`badge ${replayResult.verdict.success ? "badge-fail" : "badge-pass"}`}>
                      {replayResult.verdict.success ? "Still Vulnerable" : "Attack Neutralized"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div className="bg-white p-2 rounded-lg border border-[#d9d8d3]">
                      <div className="text-[#8a8c97] text-[10px]">Total Steps</div>
                      <div className="font-semibold text-[#1c1e2b] mt-0.5">{replayResult.total_steps} executed</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#d9d8d3]">
                      <div className="text-[#8a8c97] text-[10px]">Invariants Violated</div>
                      <div className={`font-semibold mt-0.5 ${replayResult.verdict.violated_invariants.length > 0 ? "text-[#b83a32]" : "text-[#2e6a4f]"}`}>
                        {replayResult.verdict.violated_invariants.length > 0
                          ? replayResult.verdict.violated_invariants.join(", ")
                          : "None (Blocked)"}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#d9d8d3]">
                      <div className="text-[#8a8c97] text-[10px]">Policy Gate Status</div>
                      <div className="text-[#2e6a4f] font-semibold mt-0.5">{replayResult.target_defense} Enforced</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#2e6a4f]/90 leading-relaxed">
                    Cached tool proposals were re-evaluated through the ToolGateway. Deterministic software invariants intercepted the payload without re-prompting the LLM.
                  </p>
                </div>
              )}

              {/* Step Timeline */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="label">Execution Timeline</span>
                  <span className="font-mono text-[11px] text-[#8a8c97]">{selectedTraceSteps.length} events</span>
                </div>

                {loadingTrace ? (
                  <div className="py-8 text-center text-xs font-mono text-[#8a8c97]">
                    Loading trace steps...
                  </div>
                ) : selectedTraceSteps.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTraceSteps.map((step, idx) => {
                      const isViolation = step.event_type === "invariant_violated";
                      const isBlocked = step.event_type === "tool_call_blocked";
                      const isExecution = step.event_type === "tool_execution_completed";
                      const isProposed = step.event_type === "tool_call_proposed";

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3 text-xs space-y-1.5 transition ${
                            isViolation
                              ? "bg-[#fbecea] border-[#b83a32]/30"
                              : isBlocked
                              ? "bg-[#fbf3e3] border-[#946013]/30"
                              : isExecution
                              ? "bg-white border-[#e9e8e4]"
                              : "bg-[#fbfbfa] border-[#e9e8e4]"
                          }`}
                        >
                          {/* Step header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#efefec] text-[#5a5d6b]">
                                #{step.step_number}
                              </span>
                              <span className="font-medium text-[#1c1e2b]">
                                {step.event_type}
                              </span>
                              {step.tainted && (
                                <span className="badge badge-fail text-[10px] py-0 px-1.5">
                                  TAINTED
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-[#8a8c97]">
                              {step.actor}
                            </span>
                          </div>

                          {/* Tool Name */}
                          {step.tool_name && (
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="text-[#8a8c97]">Tool:</span>
                              <span className="font-semibold text-[#ee7b30]">{step.tool_name}</span>
                            </div>
                          )}

                          {/* Arguments */}
                          {step.arguments && Object.keys(step.arguments).length > 0 && (
                            <div className="bg-[#f6f6f4] rounded-lg p-2 font-mono text-[11px] text-[#1c1e2b] border border-[#e9e8e4] overflow-x-auto">
                              <pre>{JSON.stringify(step.arguments, null, 2)}</pre>
                            </div>
                          )}

                          {/* Policy Decision */}
                          {step.policy_decision && (
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-[#8a8c97]">Policy:</span>
                              <span className={`font-semibold ${
                                step.policy_decision === "DENY" ? "text-[#b83a32]" : "text-[#2e6a4f]"
                              }`}>
                                {step.policy_decision}
                              </span>
                              {step.reason_code && (
                                <span className="text-[#8a8c97]">({step.reason_code})</span>
                              )}
                            </div>
                          )}

                          {/* Result */}
                          {step.tool_result && (
                            <div className="bg-[#f6f6f4] rounded-lg p-2 font-mono text-[11px] text-[#5a5d6b] border border-[#e9e8e4]">
                              <span className="text-[#8a8c97] block mb-0.5">Result:</span>
                              <pre>{JSON.stringify(step.tool_result, null, 2)}</pre>
                            </div>
                          )}

                          {/* Input */}
                          {step.input && (
                            <div className="text-xs text-[#5a5d6b] bg-[#f6f6f4] p-2 rounded-lg border border-[#e9e8e4]">
                              <span className="text-[#8a8c97] block font-mono text-[10px] mb-0.5">Prompt:</span>
                              {step.input}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-[#8a8c97] border border-[#e9e8e4] rounded-xl bg-[#fbfbfa]">
                    Select an attack trace on the left to inspect its causal steps.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="card card-pad bg-white text-center py-12 text-xs font-mono text-[#8a8c97]">
              No attack traces captured yet. Run a campaign to inspect execution graphs.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
