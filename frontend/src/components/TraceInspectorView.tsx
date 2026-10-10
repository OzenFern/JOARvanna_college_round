"use client";

import React, { useState, useEffect } from "react";
import { 
  RotateCcw, 
  ShieldCheck, 
  AlertTriangle, 
  Tag,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronRight,
  Code2,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { AttackResult, TraceStep } from "@/types";
import { api } from "@/lib/api";

interface TraceInspectorViewProps {
  findings: AttackResult[];
  selectedTraceId?: string | null;
  onReplaySuccess?: () => void;
}

export default function TraceInspectorView({ 
  findings, 
  selectedTraceId: initialSelectedTraceId,
  onReplaySuccess 
}: TraceInspectorViewProps) {
  const [selectedAttack, setSelectedAttack] = useState<AttackResult | null>(null);
  const [selectedTraceSteps, setSelectedTraceSteps] = useState<TraceStep[]>([]);
  const [loadingTrace, setLoadingTrace] = useState<boolean>(false);
  const [replayLoading, setReplayLoading] = useState<boolean>(false);
  const [copiedTrace, setCopiedTrace] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"timeline" | "raw">("timeline");
  const [replayResult, setReplayResult] = useState<{
    original_defense: string;
    target_defense: string;
    original_action_count: number;
    replayed_action_count: number;
    blocked_count: number;
    exploit_prevented: boolean;
    replayed_steps: TraceStep[];
  } | null>(null);

  // Auto-select attack based on initialSelectedTraceId or first available finding
  useEffect(() => {
    if (findings.length === 0) return;

    if (initialSelectedTraceId) {
      const match = findings.find(f => f.trace_ids?.includes(initialSelectedTraceId));
      if (match) {
        handleSelectAttack(match);
        return;
      }
    }

    if (!selectedAttack) {
      handleSelectAttack(findings[0]);
    }
  }, [findings, initialSelectedTraceId]);

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
      if (onReplaySuccess) onReplaySuccess();
    } catch (err: any) {
      alert(`Replay failed: ${err.message}`);
    } finally {
      setReplayLoading(false);
    }
  };

  const handleCopyTraceJson = () => {
    if (!selectedTraceSteps.length) return;
    navigator.clipboard.writeText(JSON.stringify(selectedTraceSteps, null, 2));
    setCopiedTrace(true);
    setTimeout(() => setCopiedTrace(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-[#121620] to-[#141926] p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Causal Trace Inspector &amp; Exact Replay</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                Zero Model Cost Replay
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Every step is recorded as an immutable causal graph. Test whether upgraded defense gates block previous exploits by replaying recorded model responses without making fresh LLM API calls.
            </p>
          </div>

          {selectedAttack && selectedAttack.trace_ids?.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTraceJson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 transition"
                title="Copy trace steps JSON"
              >
                {copiedTrace ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTrace ? "Copied" : "Export JSON"}</span>
              </button>

              <button
                onClick={() => handleRunReplay("D1+D2+D3")}
                disabled={replayLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono bg-red-600 hover:bg-red-500 text-white font-medium transition shadow-sm disabled:opacity-50"
              >
                {replayLoading ? (
                  <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Replay Against Full Stack</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Finding List, Right Causal Trace Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attack Findings Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider px-1">
            <span>Captured Attacks ({findings.length})</span>
            <span>Surface</span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {findings.map((atk) => {
              const isSelected = selectedAttack?.attack_id === atk.attack_id;
              const isExploited = atk.successes > 0;
              return (
                <div
                  key={atk.attack_id}
                  onClick={() => handleSelectAttack(atk)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-left relative overflow-hidden group ${
                    isSelected
                      ? "bg-gradient-to-r from-[#171d2b] to-[#121620] border-red-500/80 shadow-md shadow-red-950/20"
                      : "bg-[#121620] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#161a26]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-zinc-200 group-hover:text-white transition">
                      {atk.attack_id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {atk.surface}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 font-medium line-clamp-1">{atk.name}</p>

                  <div className="flex items-center justify-between mt-3 text-[11px] font-mono">
                    <span className={isExploited ? "text-red-400 font-semibold flex items-center gap-1" : "text-emerald-400 font-semibold flex items-center gap-1"}>
                      {isExploited ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      {isExploited ? "Exploit Succeeded" : "Blocked by Policy"}
                    </span>
                    <span className="text-zinc-500">
                      {atk.trace_ids?.length || 0} trace{atk.trace_ids?.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                  )}
                </div>
              );
            })}

            {findings.length === 0 && (
              <div className="p-8 text-center border border-zinc-800/80 rounded-xl bg-[#121620] text-xs font-mono text-zinc-500">
                No attack traces found. Execute a campaign from the Campaign Runner to populate traces.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Trace Details & Steps Timeline */}
        <div className="lg:col-span-8">
          {selectedAttack ? (
            <div className="rounded-xl border border-zinc-800 bg-[#121620] p-6 space-y-6 shadow-sm">
              {/* Selected Finding Header */}
              <div className="border-b border-zinc-800/80 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">
                      {selectedAttack.attack_id}
                    </span>
                    <h2 className="text-sm font-semibold text-zinc-100">{selectedAttack.name}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode(viewMode === "timeline" ? "raw" : "timeline")}
                      className="px-2.5 py-1 rounded text-[11px] font-mono bg-[#0B0D13] border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition flex items-center gap-1"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>{viewMode === "timeline" ? "View Raw JSON" : "View Timeline"}</span>
                    </button>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      selectedAttack.severity === "CRITICAL" ? "bg-red-950 text-red-400 border border-red-800/50" :
                      selectedAttack.severity === "HIGH" ? "bg-amber-950 text-amber-400 border border-amber-800/50" :
                      "bg-zinc-800 text-zinc-300"
                    }`}>
                      {selectedAttack.severity}
                    </span>
                  </div>
                </div>

                <div className="mt-3 bg-[#0B0D13] p-3 rounded-lg border border-zinc-800/60 font-mono text-xs text-zinc-300 break-words">
                  <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Adversary Payload</span>
                  "{selectedAttack.payload}"
                </div>

                {selectedAttack.violated_invariants?.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-xs font-mono">
                    <span className="text-zinc-500">Violated Invariants:</span>
                    {selectedAttack.violated_invariants.map((inv) => (
                      <span key={inv} className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/50 font-bold">
                        {inv}
                      </span>
                    ))}
                    <span className="text-zinc-400 text-[11px] ml-2">({selectedAttack.what_leaked_or_abused})</span>
                  </div>
                )}
              </div>

              {/* Exact Replay Outcome Panel (if evaluated) */}
              {replayResult && (
                <div className="bg-gradient-to-r from-[#0d1f18] to-[#121620] border border-emerald-500/40 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300 font-mono">
                        Exact Deterministic Replay Completed
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                      0 Live LLM API Calls
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="bg-[#0B0D13]/80 p-2.5 rounded-lg border border-zinc-800">
                      <div className="text-zinc-500 text-[10px] uppercase">Original Baseline</div>
                      <div className="text-zinc-200 font-bold mt-0.5">{replayResult.original_action_count} actions executed</div>
                    </div>
                    <div className="bg-[#0B0D13]/80 p-2.5 rounded-lg border border-zinc-800">
                      <div className="text-zinc-500 text-[10px] uppercase">Replay Actions Blocked</div>
                      <div className="text-red-400 font-bold mt-0.5">{replayResult.blocked_count} halted by gate</div>
                    </div>
                    <div className="bg-[#0B0D13]/80 p-2.5 rounded-lg border border-zinc-800">
                      <div className="text-zinc-500 text-[10px] uppercase">Hardened Gate Status</div>
                      <div className="text-emerald-400 font-bold mt-0.5">D1+D2+D3 Enforced</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    The tool invocations that succeeded in baseline were deterministically re-evaluated against the hardened policy engine. All unauthorized actions were intercepted and blocked before execution.
                  </p>
                </div>
              )}

              {/* View Mode: Raw JSON or Step Timeline */}
              {viewMode === "raw" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>Raw Trace Data</span>
                    <span>{selectedTraceSteps.length} events</span>
                  </div>
                  <pre className="bg-[#0B0D13] p-4 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 max-h-[500px] overflow-y-auto">
                    {JSON.stringify(selectedTraceSteps, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Causal Execution Timeline</span>
                    </span>
                    <span className="text-[11px] text-zinc-500">{selectedTraceSteps.length} total events</span>
                  </div>

                  {loadingTrace ? (
                    <div className="py-12 text-center text-xs font-mono text-zinc-500 flex flex-col items-center gap-2">
                      <span className="animate-spin inline-block h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                      <span>Loading trace steps...</span>
                    </div>
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
                            className={`rounded-xl border p-4 space-y-2.5 text-xs transition relative ${
                              isViolation
                                ? "bg-red-950/25 border-red-700/60 shadow-sm shadow-red-950/20"
                                : isToolBlocked
                                ? "bg-amber-950/25 border-amber-700/60"
                                : isExecuted
                                ? "bg-[#0E111A] border-zinc-800 hover:border-zinc-700"
                                : "bg-[#0B0D13] border-zinc-800/60"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 font-semibold">
                                  #{step.step_number}
                                </span>
                                <span className={`font-mono text-xs font-semibold ${
                                  isViolation ? "text-red-400" :
                                  isToolBlocked ? "text-amber-400" :
                                  isExecuted ? "text-emerald-400" : "text-zinc-200"
                                }`}>
                                  {step.event_type}
                                </span>
                                {step.tainted && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-400 border border-red-800/40">
                                    <Tag className="w-2.5 h-2.5" />
                                    <span>TAINTED</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                                Actor: <strong className="text-zinc-200">{step.actor}</strong>
                              </span>
                            </div>

                            {/* Tool Name or Invariant */}
                            {step.tool_name && (
                              <div className="flex items-center gap-2 font-mono text-zinc-300 text-xs">
                                <span className="text-zinc-500">Tool Target:</span>
                                <span className="text-blue-400 font-bold bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40">
                                  {step.tool_name}
                                </span>
                              </div>
                            )}

                            {/* Tool Arguments */}
                            {step.arguments && Object.keys(step.arguments).length > 0 && (
                              <div className="bg-[#0B0D13] rounded-lg p-2.5 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                                <span className="text-zinc-500 block mb-1">Arguments:</span>
                                <pre className="text-zinc-300 whitespace-pre-wrap">{JSON.stringify(step.arguments, null, 2)}</pre>
                              </div>
                            )}

                            {/* Policy Decision or Tool Result */}
                            {step.policy_decision && (
                              <div className="flex items-center gap-2 font-mono text-[11px]">
                                <span className="text-zinc-500">Policy Gate Decision:</span>
                                <span className={`px-2 py-0.5 rounded font-bold uppercase border ${
                                  step.policy_decision === "DENY" ? "bg-red-950 text-red-400 border-red-800" :
                                  step.policy_decision === "ALLOW" ? "bg-emerald-950 text-emerald-400 border-emerald-800" : 
                                  "bg-amber-950 text-amber-400 border-amber-800"
                                }`}>
                                  {step.policy_decision}
                                </span>
                                {step.reason_code && (
                                  <span className="text-zinc-400 font-mono">({step.reason_code})</span>
                                )}
                              </div>
                            )}

                            {/* Tool Result */}
                            {step.tool_result && (
                              <div className="bg-[#0B0D13]/70 rounded-lg p-2.5 border border-zinc-800/60 font-mono text-[11px] text-zinc-300">
                                <span className="text-zinc-500 block mb-1">Tool Execution Result:</span>
                                <pre className="text-zinc-400 whitespace-pre-wrap">{JSON.stringify(step.tool_result, null, 2)}</pre>
                              </div>
                            )}

                            {/* Model Output or Input */}
                            {step.model_output && (
                              <div className="text-zinc-300 text-xs bg-[#0B0D13]/50 rounded-lg p-2.5 border border-zinc-800/50">
                                <span className="text-zinc-500 block text-[10px] font-mono uppercase mb-1">Model Output:</span>
                                <p className="leading-relaxed">{step.model_output}</p>
                              </div>
                            )}
                            {step.input && (
                              <div className="text-zinc-300 text-xs bg-[#0B0D13]/50 rounded-lg p-2.5 border border-zinc-800/50">
                                <span className="text-zinc-500 block text-[10px] font-mono uppercase mb-1">Input Received:</span>
                                <p className="leading-relaxed">{step.input}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-zinc-800/60 rounded-xl bg-[#0B0D13]/40">
                      Select an attack on the left to inspect its complete causal trace graph.
                    </div>
                  )}
                </div>
              )}
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
