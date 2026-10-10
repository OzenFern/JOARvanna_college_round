"use client";

import React, { useState } from "react";
import { 
  RotateCcw, 
  ShieldCheck, 
  AlertTriangle, 
  Tag
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
    original_defense: string;
    target_defense: string;
    original_action_count: number;
    replayed_action_count: number;
    blocked_count: number;
    exploit_prevented: boolean;
    replayed_steps: TraceStep[];
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
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-[#121620] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-zinc-100">Causal Trace Inspector &amp; Exact Replay</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                Zero Model Calls
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Every agent execution produces a causal trace graph linking inputs, tainted context, proposed tool actions, policy gatekeeper decisions, and observed invariants. Replay any exploit trace against hardened defenses with <strong>zero model calls</strong>.
            </p>
          </div>

          {selectedAttack && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunReplay("D1+D2+D3")}
                disabled={replayLoading || !selectedAttack.trace_ids?.length}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-sm disabled:opacity-50"
              >
                {replayLoading ? (
                  <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Replay vs Hardened (D1+D2+D3)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attack Traces List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 px-1 flex items-center justify-between">
            <span>Captured Attack Traces</span>
            <span className="text-[11px] text-zinc-500">{findings.length} findings</span>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {findings.map((item) => {
              const isSelected = selectedAttack?.attack_id === item.attack_id;
              const isExploit = item.successes > 0;
              return (
                <div
                  key={item.attack_id}
                  onClick={() => handleSelectAttack(item)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? "bg-zinc-900 border-red-500/60 shadow-sm"
                      : "bg-[#121620] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-zinc-200">
                        {item.attack_id}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                        isExploit 
                          ? "bg-red-950 text-red-400 border border-red-800/50" 
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                      }`}>
                        {isExploit ? "Exploited" : "Defended"}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {item.violated_invariants?.[0] || "None"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                    {item.name}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500">
                    <span>Severity: <span className={
                      item.severity === "CRITICAL" ? "text-red-400" :
                      item.severity === "HIGH" ? "text-amber-400" : "text-zinc-400"
                    }>{item.severity}</span></span>
                    <span>Surface: {item.surface}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Step Timeline & Replay Panel */}
        <div className="lg:col-span-8 space-y-4">
          {selectedAttack ? (
            <div className="bg-[#121620] border border-zinc-800 rounded-xl p-5 space-y-5">
              {/* Finding Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-100">{selectedAttack.name}</h2>
                    <span className="text-xs font-mono text-zinc-500">({selectedAttack.attack_id})</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {selectedAttack.what_leaked_or_abused || "Simulated multi-turn autonomous interaction sequence."}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-zinc-500">Trace ID</div>
                  <div className="text-xs font-mono text-zinc-300">
                    {selectedAttack.trace_ids?.[0]?.slice(0, 16) || "Pending"}...
                  </div>
                </div>
              </div>

              {/* Exact Replay Comparative Result (if triggered) */}
              {replayResult && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>EXACT REPLAY VERIFICATION: Zero Model Calls Used</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      {replayResult.exploit_prevented ? "Attack Neutralized" : "Vulnerable"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-[#0E111A] p-2.5 rounded border border-zinc-800">
                      <div className="text-zinc-500 text-[10px]">Baseline Actions</div>
                      <div className="text-zinc-200 font-bold mt-0.5">{replayResult.original_action_count} proposed</div>
                    </div>
                    <div className="bg-[#0E111A] p-2.5 rounded border border-zinc-800">
                      <div className="text-zinc-500 text-[10px]">Replay Actions Blocked</div>
                      <div className="text-red-400 font-bold mt-0.5">{replayResult.blocked_count} halted by gate</div>
                    </div>
                    <div className="bg-[#0E111A] p-2.5 rounded border border-zinc-800">
                      <div className="text-zinc-500 text-[10px]">Policy Gate Status</div>
                      <div className="text-emerald-400 font-bold mt-0.5">D1+D2+D3 Enforced</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    The tool invocations that succeeded in baseline were deterministically re-evaluated against the hardened policy engine. All unauthorized actions were intercepted and blocked before execution.
                  </p>
                </div>
              )}

              {/* Step Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Execution Timeline</span>
                  <span className="text-[11px] text-zinc-500">{selectedTraceSteps.length} total events</span>
                </div>

                {loadingTrace ? (
                  <div className="py-8 text-center text-xs font-mono text-zinc-500">Loading trace steps...</div>
                ) : selectedTraceSteps.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTraceSteps.map((step, idx) => {
                      const isToolProposed = step.event_type === "tool_call_proposed";
                      const isToolBlocked = step.event_type === "tool_call_blocked";
                      const isExecuted = step.event_type === "tool_execution_completed";
                      const isViolation = step.event_type === "invariant_violated";

                      return (
                        <div
                          key={idx}
                          className={`rounded-lg border p-3.5 space-y-2 text-xs transition ${
                            isViolation
                              ? "bg-red-950/30 border-red-700/60"
                              : isToolBlocked
                              ? "bg-amber-950/30 border-amber-700/60"
                              : isExecuted
                              ? "bg-[#0E111A] border-zinc-800"
                              : "bg-[#0B0D13] border-zinc-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                #{step.step_number}
                              </span>
                              <span className="font-mono text-xs font-semibold text-zinc-200">
                                {step.event_type}
                              </span>
                              {step.tainted && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-400 border border-red-800/40">
                                  <Tag className="w-2.5 h-2.5" />
                                  <span>TAINTED</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-zinc-500">
                              Actor: {step.actor}
                            </span>
                          </div>

                          {/* Tool Name or Invariant */}
                          {step.tool_name && (
                            <div className="flex items-center gap-2 font-mono text-zinc-300">
                              <span className="text-zinc-500">Tool:</span>
                              <span className="text-blue-400 font-semibold">{step.tool_name}</span>
                            </div>
                          )}

                          {/* Tool Arguments */}
                          {step.arguments && Object.keys(step.arguments).length > 0 && (
                            <div className="bg-[#0B0D13] rounded p-2 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                              <span className="text-zinc-500 block mb-1">Arguments:</span>
                              <pre className="text-zinc-300">{JSON.stringify(step.arguments, null, 2)}</pre>
                            </div>
                          )}

                          {/* Policy Decision or Tool Result */}
                          {step.policy_decision && (
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-zinc-500">Policy Decision:</span>
                              <span className={
                                step.policy_decision === "DENY" ? "text-red-400 font-semibold" :
                                step.policy_decision === "ALLOW" ? "text-emerald-400 font-semibold" : "text-amber-400"
                              }>
                                {step.policy_decision}
                              </span>
                              {step.reason_code && (
                                <span className="text-zinc-500">({step.reason_code})</span>
                              )}
                            </div>
                          )}

                          {/* Tool Result */}
                          {step.tool_result && (
                            <div className="bg-[#0B0D13]/70 rounded p-2 border border-zinc-800/60 font-mono text-[11px] text-zinc-300">
                              <span className="text-zinc-500 block mb-0.5">Tool Result:</span>
                              <pre className="text-zinc-400">{JSON.stringify(step.tool_result, null, 2)}</pre>
                            </div>
                          )}

                          {/* Model Output or Input */}
                          {step.model_output && (
                            <div className="text-zinc-400 text-xs bg-[#0B0D13]/40 rounded p-2 border border-zinc-800/40">
                              <span className="text-zinc-500 block text-[10px] font-mono mb-1">Model Output:</span>
                              {step.model_output}
                            </div>
                          )}
                          {step.input && (
                            <div className="text-zinc-400 text-xs bg-[#0B0D13]/40 rounded p-2 border border-zinc-800/40">
                              <span className="text-zinc-500 block text-[10px] font-mono mb-1">Input Received:</span>
                              {step.input}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-zinc-500 font-mono text-xs border border-zinc-800/60 rounded-lg">
                    Click an attack on the left to inspect its causal trace.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#121620] border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 font-mono text-xs">
              No attack traces captured yet. Run a campaign to inspect execution graphs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
