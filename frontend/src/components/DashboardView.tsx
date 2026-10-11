"use client";

import React from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Play,
  RotateCcw,
  Zap,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { EvaluationSummary } from "@/types";

interface DashboardViewProps {
  evaluations: EvaluationSummary[];
  policy: { tool_allowlist?: string[]; registered_tools?: string[] } | null;
  onNavigate: (tab: "runner" | "traces" | "compare" | "audit") => void;
  onRunQuickEvaluation: () => void;
  loading: boolean;
}

export default function DashboardView({
  evaluations,
  policy,
  onNavigate,
  onRunQuickEvaluation,
  loading,
}: DashboardViewProps) {
  const d0 = evaluations.find((e) => e.active_defense === "D0");
  const fullStack = evaluations.find((e) => e.active_defense === "D1+D2+D3");

  const baselineASR = d0 ? (d0.attack_success_rate * 100).toFixed(1) : "100.0";
  const defendedASR = fullStack ? (fullStack.attack_success_rate * 100).toFixed(1) : "0.0";
  const benignPass = fullStack ? (fullStack.benign_pass_rate * 100).toFixed(1) : "100.0";
  const toolCount = policy?.registered_tools?.length ?? 7;
  const allowlistCount = policy?.tool_allowlist?.length ?? 4;
  const overPermissioned = toolCount - allowlistCount;

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* ── Page Header (Editorial & Minimalist) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="label mb-1.5 text-[#ee7b30]">Autonomous AI Red Team</div>
          <h1 className="h1">Inspect agent vulnerabilities</h1>
          <p className="muted text-sm mt-1 max-w-xl">
            Simulate automated prompt injections and exfiltrations, trace unauthorized tool executions, and verify policy defenses with zero model calls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("compare")}
            className="btn btn-sm"
          >
            Defense matrix
          </button>
          <button
            onClick={onRunQuickEvaluation}
            disabled={loading}
            className="btn btn-sm btn-primary"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>{loading ? "Testing..." : "Run benchmark"}</span>
          </button>
        </div>
      </div>

      {/* ── Core Metric Cards (Clean & High Contrast) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Baseline Exploit Rate */}
        <div className="card card-pad bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#b83a32]">Baseline Exploit Rate</span>
            <span className="badge badge-fail">D0 Prompt Only</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#1c1e2b] font-mono">
            {baselineASR}%
          </div>
          <p className="text-xs text-[#5a5d6b] mt-2 leading-relaxed">
            All 10 multi-turn attacks bypass pure prompt guardrails.
          </p>
        </div>

        {/* Hardened Exploit Rate */}
        <div className="card card-pad bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#2e6a4f]">Hardened Exploit Rate</span>
            <span className="badge badge-pass">D1+D2+D3</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#1c1e2b] font-mono">
            {defendedASR}%
          </div>
          <p className="text-xs text-[#5a5d6b] mt-2 leading-relaxed">
            Software policy gate intercepts actions before side effects.
          </p>
        </div>

        {/* Benign Pass Rate */}
        <div className="card card-pad bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#3a3f9e]">Benign Utility</span>
            <span className="badge badge-neutral">10 Tasks</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#1c1e2b] font-mono">
            {benignPass}%
          </div>
          <p className="text-xs text-[#5a5d6b] mt-2 leading-relaxed">
            Legitimate user operations continue without degradation.
          </p>
        </div>

        {/* Over-permissioned Tools */}
        <div 
          onClick={() => onNavigate("audit")}
          className="card card-pad bg-white cursor-pointer hover:border-[#ee7b30] transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#946013]">Excess Capabilities</span>
            <span className="badge badge-warn">Least Privilege</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-[#1c1e2b] font-mono flex items-center justify-between">
            <span>{overPermissioned} Tools</span>
            <ArrowUpRight className="w-4 h-4 text-[#8a8c97] group-hover:text-[#ee7b30] transition" />
          </div>
          <p className="text-xs text-[#5a5d6b] mt-2 leading-relaxed">
            Tools exposed to agent but unused in normal workflows.
          </p>
        </div>
      </div>

      {/* ── Key Highlights (Three Clean Feature Cards like Black Box demo cases) ── */}
      <div>
        <div className="mb-4">
          <h2 className="h2">Three security boundaries in action</h2>
          <p className="muted text-xs mt-0.5">
            How AgentBreak decouples model generation from authoritative execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="card card-pad flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="badge badge-accent">D1 Gatekeeper</span>
                <span className="font-mono text-[11px] text-[#8a8c97]">INV-02, INV-05</span>
              </div>
              <h3 className="font-semibold text-[15px] text-[#1c1e2b] mt-3">
                Pre-execution Thresholds
              </h3>
              <p className="text-xs text-[#5a5d6b] mt-1.5 leading-relaxed">
                Refunds above $50 require human approval. Blacklisted domains and path traversals are blocked at the dispatch gateway.
              </p>
            </div>
            <button
              onClick={() => onNavigate("runner")}
              className="mt-4 pt-3 border-t border-[#e9e8e4] text-left text-xs font-medium text-[#ee7b30] hover:underline flex items-center gap-1"
            >
              Simulate in campaign <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="card card-pad flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="badge badge-accent">D2 Canary Filter</span>
                <span className="font-mono text-[11px] text-[#8a8c97]">INV-01</span>
              </div>
              <h3 className="font-semibold text-[15px] text-[#1c1e2b] mt-3">
                Deterministic Token Leak Defense
              </h3>
              <p className="text-xs text-[#5a5d6b] mt-1.5 leading-relaxed">
                Planted canary tokens (SSN, API keys) are detected by regex on all outbound messages. Leaks are halted before egress.
              </p>
            </div>
            <button
              onClick={() => onNavigate("traces")}
              className="mt-4 pt-3 border-t border-[#e9e8e4] text-left text-xs font-medium text-[#ee7b30] hover:underline flex items-center gap-1"
            >
              Inspect canary trace <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="card card-pad flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="badge badge-accent">D3 Taint Tracking</span>
                <span className="font-mono text-[11px] text-[#8a8c97]">INV-06</span>
              </div>
              <h3 className="font-semibold text-[15px] text-[#1c1e2b] mt-3">
                Indirect Injection Quarantine
              </h3>
              <p className="text-xs text-[#5a5d6b] mt-1.5 leading-relaxed">
                When untrusted documents contaminate context, downstream tool proposals are flagged tainted and require approval.
              </p>
            </div>
            <button
              onClick={() => onNavigate("compare")}
              className="mt-4 pt-3 border-t border-[#e9e8e4] text-left text-xs font-medium text-[#ee7b30] hover:underline flex items-center gap-1"
            >
              Compare tradeoffs <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
