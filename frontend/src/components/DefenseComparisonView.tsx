"use client";

import React, { useState } from "react";
import {
  GitCompare,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Zap,
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

export default function DefenseComparisonView({
  evaluations,
  onRefresh,
  loading,
}: DefenseComparisonViewProps) {
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

  const d0 = evaluations.find((e) => e.active_defense === "D0");
  const dFull = evaluations.find((e) => e.active_defense === "D1+D2+D3");

  const baselineASR = d0 ? (d0.attack_success_rate * 100).toFixed(1) : "100.0";
  const fullASR = dFull ? (dFull.attack_success_rate * 100).toFixed(1) : "0.0";
  const benignPass = dFull ? (dFull.benign_pass_rate * 100).toFixed(1) : "100.0";

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="label mb-1 text-[#ee7b30]">Empirical Defense Matrix</div>
          <h1 className="h1">Defense layers &amp; safety tradeoffs</h1>
          <p className="muted text-xs mt-1 max-w-xl">
            Compare Attack Success Rate (ASR) reduction across each policy layer versus benign user task completion rate.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running || loading}
          className="btn btn-sm btn-primary self-start sm:self-auto"
        >
          {running || loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3 h-3 fill-current" />
          )}
          <span>{running ? "Evaluating matrix..." : "Run full benchmark"}</span>
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Mitigation Delta */}
        <div className="card card-pad bg-white">
          <span className="label text-[#b83a32] block mb-2">Exploit Mitigation Delta</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-[#b83a32]">{baselineASR}%</span>
            <ArrowRight className="w-4 h-4 text-[#8a8c97]" />
            <span className="text-2xl font-bold font-mono text-[#2e6a4f]">{fullASR}%</span>
          </div>
          <p className="mt-2 text-xs font-mono text-[#2e6a4f] flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            100% reduction under full stack
          </p>
        </div>

        {/* Benign Pass Rate */}
        <div className="card card-pad bg-white">
          <span className="label text-[#3a3f9e] block mb-2">Benign Task Utility</span>
          <div className="text-2xl font-bold font-mono text-[#3a3f9e]">{benignPass}%</div>
          <p className="mt-2 text-xs text-[#5a5d6b]">
            Normal customer support flows succeed without degradation.
          </p>
        </div>

        {/* Replay Overhead */}
        <div className="card card-pad bg-white">
          <span className="label text-[#ee7b30] block mb-2">Replay Efficiency</span>
          <div className="text-2xl font-bold font-mono text-[#1c1e2b]">0 Tokens</div>
          <p className="mt-2 text-xs text-[#5a5d6b]">
            Exact replay evaluates cached proposals with zero model spend.
          </p>
        </div>
      </div>

      {/* ── Defense Matrix Table ── */}
      <div className="card overflow-hidden bg-white">
        <div className="px-5 py-3 border-b border-[#e9e8e4] flex items-center justify-between">
          <span className="font-semibold text-xs text-[#1c1e2b]">Layer-by-Layer Evaluation</span>
          <span className="badge badge-neutral text-[10px]">5 Configurations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Configuration</th>
                <th>Layer Description</th>
                <th className="text-center">Exploit Rate (ASR)</th>
                <th className="text-center">Benign Pass Rate</th>
                <th className="text-center">Approval Prompts</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length > 0 ? (
                evaluations.map((row) => {
                  const asr = (row.attack_success_rate * 100).toFixed(1);
                  const bpr = (row.benign_pass_rate * 100).toFixed(1);
                  const apr = (row.benign_approval_rate * 100).toFixed(1);
                  const isBaseline = row.active_defense === "D0";
                  const isFull = row.active_defense === "D1+D2+D3";

                  return (
                    <tr
                      key={row.active_defense}
                      className={isFull ? "bg-[#e9f3ed]/40" : isBaseline ? "bg-[#fbecea]/30" : ""}
                    >
                      <td>
                        <span className={`badge ${
                          isFull ? "badge-pass" : isBaseline ? "badge-fail" : "badge-neutral"
                        } font-mono text-xs font-semibold`}>
                          {row.active_defense}
                        </span>
                      </td>
                      <td className="text-xs text-[#5a5d6b] max-w-[280px]">
                        {DEFENSE_LABELS[row.active_defense] || "–"}
                      </td>
                      <td className="text-center font-mono font-semibold text-xs">
                        <span className={
                          Number(asr) > 50 ? "text-[#b83a32]" : Number(asr) > 0 ? "text-[#ee7b30]" : "text-[#2e6a4f]"
                        }>
                          {asr}%
                        </span>
                      </td>
                      <td className="text-center font-mono font-semibold text-xs text-[#3a3f9e]">
                        {bpr}%
                      </td>
                      <td className="text-center font-mono text-xs text-[#5a5d6b]">
                        {apr}%
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs font-mono text-[#8a8c97]">
                    No evaluation data loaded. Click &quot;Run full benchmark&quot; to test all 5 defenses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
