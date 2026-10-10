"use client";

import React from "react";
import {
  Activity, ShieldAlert, CheckCircle2, AlertTriangle,
  ArrowUpRight, Zap, Play, ShieldCheck
} from "lucide-react";
import { EvaluationSummary } from "@/types";

interface DashboardViewProps {
  evaluations: EvaluationSummary[];
  onNavigate: (tab: "runner" | "traces" | "compare" | "audit") => void;
  onRunQuickEvaluation: () => void;
  loading: boolean;
}

const MetricCard = ({
  label, value, sub, accent, icon: Icon, onClick,
}: {
  label: string; value: string; sub: string; accent: string;
  icon: any; onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden rounded-xl p-5 transition group ${onClick ? "cursor-pointer" : ""}`}
    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = "var(--border-default)")}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = "var(--border-subtle)")}
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
      <Icon className={`w-4 h-4 ${accent}`} />
    </div>
    <div className={`text-2xl font-bold font-mono ${accent}`}>{value}</div>
    <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
    {onClick && (
      <ArrowUpRight className={`absolute bottom-4 right-4 w-4 h-4 opacity-0 group-hover:opacity-100 transition ${accent}`} />
    )}
    {/* Accent bar */}
    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
      accent.includes("red") ? "accent-bar-red" :
      accent.includes("emerald") ? "accent-bar-emerald" :
      accent.includes("blue") ? "accent-bar-blue" : "accent-bar-amber"
    }`} />
  </div>
);

export default function DashboardView({ evaluations, onNavigate, onRunQuickEvaluation, loading }: DashboardViewProps) {
  const d0       = evaluations.find(e => e.active_defense === "D0");
  const fullStack = evaluations.find(e => e.active_defense === "D1+D2+D3");

  const baselineASR  = d0        ? (d0.attack_success_rate  * 100).toFixed(1) : "100.0";
  const defendedASR  = fullStack ? (fullStack.attack_success_rate * 100).toFixed(1) : "0.0";
  const benignPass   = fullStack ? (fullStack.benign_pass_rate    * 100).toFixed(1) : "100.0";

  return (
    <div className="space-y-5 fade-in">

      {/* ── Posture Banner ── */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                AI Security Posture Overview
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider"
                style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.22)" }}>
                Baseline (D0) Vulnerable
              </span>
            </div>
            <p className="text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Target Customer-Support AI Agent operates in a controlled sandbox with 7 mock tools.
              In unhardened baseline (D0), security rules exist only in prompt text.
              Active defense layers (D1 Tool Gatekeeper, D2 Canary Filter, D3 Content Sanitizer)
              enforce policies in application code.
            </p>
          </div>

          <button
            onClick={onRunQuickEvaluation}
            disabled={loading}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-sans font-medium text-white transition disabled:opacity-45"
            style={{ background: "#C41E1E", boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = "#DC2626")}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = "#C41E1E")}
          >
            {loading
              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Play className="w-4 h-4 fill-current" />
            }
            <span>{loading ? "Evaluating..." : "Run Security Matrix"}</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <MetricCard
            label="Baseline Exploit Rate"
            value={`${baselineASR}%`}
            sub="Prompt-only guardrails bypassed"
            accent="text-red-400"
            icon={AlertTriangle}
          />
          <MetricCard
            label="Defended Exploit Rate"
            value={`${defendedASR}%`}
            sub="Under Full Stack (D1+D2+D3)"
            accent="text-emerald-400"
            icon={CheckCircle2}
          />
          <MetricCard
            label="Benign Task Pass Rate"
            value={`${benignPass}%`}
            sub="10/10 legitimate tasks pass"
            accent="text-blue-400"
            icon={Zap}
          />
          <MetricCard
            label="Over-Permissioned Tools"
            value="2 Tools"
            sub="http_request &amp; execute_shell"
            accent="text-amber-400"
            icon={ShieldAlert}
            onClick={() => onNavigate("audit")}
          />
        </div>
      </div>

      {/* ── Two Column Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Policy Boundary */}
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <h2 className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            <ShieldCheck className="w-4 h-4 text-red-400" />
            Pre-Execution Policy Boundary
          </h2>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <strong className="font-medium" style={{ color: "var(--text-primary)" }}>The model proposes; trusted application code authorizes.</strong>{" "}
            An LLM agent is never given direct network or database access. It emits a structured tool
            intent which passes through the deterministic Policy Engine. If an action violates
            invariants, it is halted before the side effect executes.
          </p>
          <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Side-Effect Isolation: ACTIVE</span>
            <button onClick={() => onNavigate("compare")}
              className="flex items-center gap-1 text-sm font-sans text-red-400 hover:text-red-300 transition">
              View Defense Matrix <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Red Team Capabilities */}
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <h2 className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            <Activity className="w-4 h-4 text-blue-400" />
            Attack Library &amp; Adaptive Mutators
          </h2>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            10 automated red-team attack scenarios spanning Prompt Injection, Indirect Document
            Injections, Memory Poisoning, and Undeclared Scope Escalation. Includes 5 rule-based
            mutators (Rephrase, Reframe, Split, Relocate, Encode) when initial attempts are deflected.
          </p>
          <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Autonomous Mutator Engine: READY</span>
            <button onClick={() => onNavigate("runner")}
              className="flex items-center gap-1 text-sm font-sans text-blue-400 hover:text-blue-300 transition">
              Launch Campaign <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
