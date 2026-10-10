"use client";

import React from "react";
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpRight, Zap, Play } from "lucide-react";
import { EvaluationSummary } from "@/types";

interface DashboardViewProps {
  evaluations: EvaluationSummary[];
  onNavigate: (tab: "runner" | "traces" | "compare" | "audit") => void;
  onRunQuickEvaluation: () => void;
  loading: boolean;
}

export default function DashboardView({
  evaluations,
  onNavigate,
  onRunQuickEvaluation,
  loading,
}: DashboardViewProps) {
  const d0 = evaluations.find((e) => e.active_defense === "D0");
  const fullStack = evaluations.find((e) => e.active_defense === "D1+D2+D3");

  const baselineASR = d0 ? (d0.attack_success_rate * 100).toFixed(1) : "100.0";
  const defendedASR = fullStack ? (fullStack.attack_success_rate * 100).toFixed(1) : "0.0";
  const benignPass = fullStack ? (fullStack.benign_pass_rate * 100).toFixed(1) : "100.0";

  return (
    <div className="space-y-6">
      {/* Top Posture Banner */}
      <div className="rounded-xl border border-zinc-800 bg-[#121620] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">AI Security Posture Overview</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-red-950/70 text-red-400 border border-red-800/50">
                Baseline (D0) Vulnerable
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
              Target Customer-Support AI Agent operates in a controlled sandbox with 7 mock tools. In unhardened baseline (D0), security rules exist only in prompt text. Active defense layers (D1 Tool Gatekeeper, D2 Canary Filter, D3 Content Sanitizer) enforce policies in application code.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRunQuickEvaluation}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono bg-red-600 hover:bg-red-500 text-white font-medium transition shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{loading ? "Evaluating..." : "Run Security Matrix"}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#0E111A] border border-zinc-800/80 rounded-lg p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Baseline Exploit Rate</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-red-400 mt-2">{baselineASR}%</div>
            <p className="text-[11px] text-zinc-500 mt-1">Prompt-only guardrails bypassed</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500/40" />
          </div>

          <div className="bg-[#0E111A] border border-zinc-800/80 rounded-lg p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Defended Exploit Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">{defendedASR}%</div>
            <p className="text-[11px] text-zinc-500 mt-1">Under Full Stack (D1+D2+D3)</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/40" />
          </div>

          <div className="bg-[#0E111A] border border-zinc-800/80 rounded-lg p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Benign Task Pass Rate</span>
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-2">{benignPass}%</div>
            <p className="text-[11px] text-zinc-500 mt-1">10/10 legitimate tasks pass</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500/40" />
          </div>

          <div 
            onClick={() => onNavigate("audit")}
            className="bg-[#0E111A] border border-zinc-800/80 hover:border-amber-600/50 rounded-lg p-4 relative cursor-pointer transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Over-Permissioned Tools</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-2">2 Tools</div>
            <p className="text-[11px] text-zinc-500 mt-1">http_request &amp; execute_shell</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500/40" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Core Defense Mechanism */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#121620] p-5">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Pre-Execution Policy Boundary</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
            <strong className="text-zinc-200">The model proposes; trusted application code authorizes.</strong> An LLM agent is never given direct network or database access. It emits a structured tool intent, which passes through the deterministic Policy Engine. If an action violates invariants, it is halted before the side effect executes.
          </p>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">Side-Effect Isolation: ACTIVE</span>
            <button
              onClick={() => onNavigate("compare")}
              className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1 transition"
            >
              <span>View Defense Matrix</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Red Team Capabilities */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#121620] p-5">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Attack Library &amp; Adaptive Mutators</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
            10 automated red-team attack scenarios spanning Prompt Injection, Indirect Document Injections, Memory Poisoning, and Undeclared Scope Escalation. Includes 5 rule-based mutators (Rephrase, Reframe, Split, Relocate, Encode) when initial attempts are deflected.
          </p>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">Autonomous Mutator Engine: READY</span>
            <button
              onClick={() => onNavigate("runner")}
              className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
            >
              <span>Launch Campaign</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
