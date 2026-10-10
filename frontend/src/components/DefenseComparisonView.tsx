"use client";

import React, { useState } from "react";
import {
  GitCompare, Play, CheckCircle2, AlertTriangle,
  ShieldCheck, Zap, DollarSign, ArrowRight, TrendingDown
} from "lucide-react";
import { EvaluationSummary } from "@/types";
import { api } from "@/lib/api";

interface DefenseComparisonViewProps {
  evaluations: EvaluationSummary[];
  onRefresh: () => void;
  loading: boolean;
}

const DEFENSE_LABELS: Record<string, string> = {
  "D0":       "Baseline — Prompt-only guardrails without software validation",
  "D1":       "Tool Gateway — Pre-execution threshold checks and domain allowlists",
  "D2":       "Canary Filter — Deterministic planted token leak interception",
  "D3":       "Taint Tracking — Tainted context requires approval for outbound actions",
  "D1+D2+D3": "Full Stack — Defense-in-depth across all security boundaries",
};

export default function DefenseComparisonView({ evaluations, onRefresh, loading }: DefenseComparisonViewProps) {
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try {
      await api.runEvaluation();
      onRefresh();
    } catch (err: any) {
      alert(`Evaluation run failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const d0    = evaluations.find(e => e.active_defense === "D0");
  const dFull = evaluations.find(e => e.active_defense === "D1+D2+D3");

  const baselineASR = d0    ? (d0.attack_success_rate  * 100).toFixed(1) : "100.0";
  const fullASR     = dFull ? (dFull.attack_success_rate * 100).toFixed(1) : "0.0";
  const benignPass  = dFull ? (dFull.benign_pass_rate   * 100).toFixed(1) : "100.0";

  return (
    <div className="space-y-5 fade-in">

      {/* ── Header Banner ── */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Defense Comparison &amp; Safety Tradeoffs
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
                Matrix Analysis
              </span>
            </div>
            <p className="text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Compare recorded Attack Success Rate (ASR) across each defense layer and the
              benign-task pass rate from the latest backend evaluation.
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={running || loading}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-sans font-medium text-white transition disabled:opacity-45"
            style={{ background: "#C41E1E", boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
            onMouseEnter={e => !(running || loading) && (e.currentTarget.style.background = "#DC2626")}
            onMouseLeave={e => !(running || loading) && (e.currentTarget.style.background = "#C41E1E")}
          >
            {running || loading
              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Play className="w-4 h-4 fill-current" />
            }
            <span>{running ? "Evaluating Matrix..." : "Run Full Evaluation"}</span>
          </button>
        </div>

        {/* Delta Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          {/* ASR Delta */}
          <div className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <span className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: "var(--text-muted)" }}>
              Exploit Mitigation Delta
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-mono text-red-400">{baselineASR}%</span>
              <ArrowRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <span className="text-xl font-bold font-mono text-emerald-400">{fullASR}%</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs font-mono text-emerald-400">
              <TrendingDown className="w-3.5 h-3.5" />
              {d0 && dFull ? `${Math.max(0, ((d0.attack_success_rate - dFull.attack_success_rate) / Math.max(d0.attack_success_rate, 0.0001) * 100)).toFixed(1)}% reduction in recorded exploits` : "Awaiting baseline and hardened runs"}
            </p>
          </div>

          {/* Benign Utility */}
          <div className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <span className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: "var(--text-muted)" }}>
              Benign Task Utility
            </span>
            <div className="text-xl font-bold font-mono text-blue-400">{benignPass}%</div>
            <p className="mt-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {dFull ? `${dFull.trials_per_attack} trial${dFull.trials_per_attack === 1 ? "" : "s"} per attack in the latest run` : "No evaluation loaded"}
            </p>
          </div>

          {/* Latency */}
          <div className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <span className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: "var(--text-muted)" }}>
              Latency Overhead
            </span>
            <div className="text-xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>Not recorded</div>
            <p className="mt-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              Backend does not currently report latency
            </p>
          </div>
        </div>
      </div>

      {/* ── Defense Matrix Table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Empirical Defense Evaluation Matrix</h2>
          </div>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>5 Defense Configurations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left data-table">
            <thead>
              <tr>
                <th>Defense Configuration</th>
                <th>Layer Description</th>
                <th className="text-center">Exploit Rate (ASR)</th>
                <th className="text-center">Benign Pass Rate</th>
                <th className="text-center">Approval Rate</th>
                <th className="text-right">Avg Cost</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length > 0 ? (
                evaluations.map(row => {
                  const asr = (row.attack_success_rate  * 100).toFixed(1);
                  const bpr = (row.benign_pass_rate     * 100).toFixed(1);
                  const apr = (row.benign_approval_rate * 100).toFixed(1);
                  const isBaseline = row.active_defense === "D0";
                  const isFull     = row.active_defense === "D1+D2+D3";

                  return (
                    <tr key={row.active_defense}
                      style={isFull ? { background: "rgba(16,185,129,0.04)" } : isBaseline ? { background: "rgba(239,68,68,0.04)" } : undefined}>
                      <td>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded"
                          style={isFull
                            ? { background: "rgba(16,185,129,0.12)", color: "#6EE7B7", border: "1px solid rgba(16,185,129,0.22)" }
                            : isBaseline
                            ? { background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.22)" }
                            : { background: "rgba(255,255,255,0.06)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }
                          }>
                          {row.active_defense}
                        </span>
                      </td>
                      <td className="text-xs" style={{ color: "var(--text-secondary)", maxWidth: "280px" }}>
                        {DEFENSE_LABELS[row.active_defense] || "–"}
                      </td>
                      <td className="text-center font-mono font-bold text-sm">
                        <span className={
                          Number(asr) > 50 ? "text-red-400" :
                          Number(asr) > 0  ? "text-amber-400" : "text-emerald-400"
                        }>{asr}%</span>
                      </td>
                      <td className="text-center font-mono font-bold text-sm">
                        <span className={Number(bpr) >= 90 ? "text-blue-400" : ""}
                          style={Number(bpr) < 90 ? { color: "var(--text-muted)" } : undefined}>
                          {bpr}%
                        </span>
                      </td>
                      <td className="text-center font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
                        {apr}%
                      </td>
                      <td className="text-right font-mono text-sm" style={{ color: "var(--text-muted)" }}>
                        Not recorded
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-mono text-sm" style={{ color: "var(--text-muted)" }}>
                    No evaluation data loaded. Click &quot;Run Full Evaluation&quot; to execute the 5-defense matrix.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Guarantee Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: ShieldCheck, accent: "text-emerald-400",
            title: "Zero Side-Effect Guarantee",
            body: "When a policy blocks a tool call, the tool implementation is never executed. Mock databases and refund ledgers remain unmutated."
          },
          {
            icon: Zap, accent: "text-blue-400",
            title: "Non-Degrading Utility",
            body: "Benign utility is reported from the latest evaluation run; no unmeasured pass-rate guarantee is shown."
          },
          {
            icon: DollarSign, accent: "text-amber-400",
            title: "Deterministic Economics",
            body: "Cost telemetry is not currently returned by the backend, so this view does not invent a price."
          },
        ].map(({ icon: Icon, accent, title, body }) => (
          <div key={title} className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            <h3 className={`flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider ${accent}`}>
              <Icon className="w-4 h-4" />
              {title}
            </h3>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
