"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Terminal,
  Activity,
  Layers,
  GitCompare,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
} from "lucide-react";
import { api, setApiKey } from "@/lib/api";
import { AttackResult, EvaluationSummary, PermissionAuditItem } from "@/types";
import DashboardView from "@/components/DashboardView";
import CampaignRunnerView from "@/components/CampaignRunnerView";
import TraceInspectorView from "@/components/TraceInspectorView";
import DefenseComparisonView from "@/components/DefenseComparisonView";
import PermissionAuditView from "@/components/PermissionAuditView";

type Tab = "dashboard" | "runner" | "traces" | "compare" | "audit";

const TABS = [
  { id: "dashboard", label: "Dashboard",          icon: Activity  },
  { id: "runner",    label: "Campaign Runner",     icon: Terminal  },
  { id: "traces",    label: "Attack Traces",       icon: Layers    },
  { id: "compare",   label: "Defense Comparison",  icon: GitCompare},
  { id: "audit",     label: "Permission Audit",    icon: ShieldAlert },
] as const;

export default function Home() {
  const [activeTab,    setActiveTab]    = useState<Tab>("dashboard");
  const [backendHealth, setBackendHealth] = useState<"ok" | "offline" | "connecting">("connecting");
  const [dbStatus,     setDbStatus]     = useState<{ engine: string; ready: boolean; configured: boolean } | null>(null);
  const [apiKeyInput,  setApiKeyInput]  = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [hasApiKey,    setHasApiKey]    = useState<boolean>(false);

  // Shared data state
  const [attacks,     setAttacks]     = useState<any[]>([]);
  const [findings,    setFindings]    = useState<AttackResult[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [auditItems,  setAuditItems]  = useState<PermissionAuditItem[]>([]);
  const [evalLoading, setEvalLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [h, atks, fnds, audit, latestEval, dbStat] = await Promise.allSettled([
        api.getHealth(),
        api.getAttacks(),
        api.getFindings(),
        api.getPermissionAudit(),
        api.getLatestEvaluation(),
        api.getDbStatus(),
      ]);

      setBackendHealth(h.status === "fulfilled" ? "ok" : "offline");
      if (atks.status       === "fulfilled") setAttacks(atks.value);
      if (fnds.status       === "fulfilled") setFindings(fnds.value);
      if (audit.status      === "fulfilled") setAuditItems(audit.value);
      if (latestEval.status === "fulfilled" && latestEval.value.length > 0) {
        setEvaluations(latestEval.value);
      }
      if (dbStat.status     === "fulfilled") setDbStatus(dbStat.value);
    } catch (e) {
      setBackendHealth("offline");
    }
  };

  const handleRunEvaluation = async () => {
    setEvalLoading(true);
    try {
      const res = await api.runEvaluation();
      if ((res as any).summaries) setEvaluations((res as any).summaries);
    } catch (err: any) {
      console.error("Evaluation failed", err);
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveKey = () => {
    setApiKey(apiKeyInput);
    setHasApiKey(!!apiKeyInput.trim());
    setShowKeyModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(8,11,18,0.85)", borderColor: "var(--border-subtle)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

          {/* Logo + Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "linear-gradient(135deg, #3B0A0A 0%, #1A0505 100%)", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 0 12px rgba(239,68,68,0.15)" }}>
              <span className="text-red-400 font-bold text-xs tracking-tighter font-mono">AB</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>AgentBreak</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-mono uppercase tracking-widest"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                  Red Team
                </span>
              </div>
              <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                Autonomous AI Security &amp; Policy Verification
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={loadData}
              title="Refresh data"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            >
              <RefreshCw className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            </button>

            {/* Backend Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
              {backendHealth === "ok" ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : backendHealth === "offline" ? (
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin inline-block" />
              )}
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>API:</span>
              <span className={`text-xs font-mono font-medium ${
                backendHealth === "ok" ? "text-emerald-400" :
                backendHealth === "offline" ? "text-red-400" : "text-zinc-400"
              }`}>
                {backendHealth}
              </span>
            </div>

            {/* Database Engine Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
              <Database className={`w-3.5 h-3.5 ${dbStatus?.ready ? "text-emerald-400" : "text-amber-400/80"}`} />
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>DB:</span>
              <span className={`text-xs font-mono font-medium ${
                dbStatus?.ready ? "text-emerald-400" : "text-amber-400/80"
              }`}>
                {dbStatus?.ready ? "PostgreSQL" : "In-Memory"}
              </span>
            </div>

            {/* Gemini Key */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition"
              style={hasApiKey
                ? { background: "rgba(245,158,11,0.10)", color: "#FCD34D", border: "1px solid rgba(245,158,11,0.25)" }
                : { background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }
              }
            >
              <Key className="w-3.5 h-3.5" />
              <span>{hasApiKey ? "Gemini Key (Active)" : "Set Gemini Key"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <nav className="border-b sticky top-14 z-40" style={{ background: "var(--bg-base)", borderColor: "var(--border-subtle)" }}>
        <div className="max-w-screen-xl mx-auto px-5 flex items-center gap-0.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition relative -mb-px"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottom: isActive ? "2px solid #EF4444" : "2px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "var(--text-secondary)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-red-400" : ""}`} style={!isActive ? { color: "var(--text-muted)" } : {}} />
                <span className="font-sans">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 fade-in">
        <div className="max-w-screen-xl mx-auto px-5 py-6">
          {activeTab === "dashboard" && (
            <DashboardView
              evaluations={evaluations}
              onNavigate={(tab) => setActiveTab(tab)}
              onRunQuickEvaluation={handleRunEvaluation}
              loading={evalLoading}
            />
          )}
          {activeTab === "runner" && (
            <CampaignRunnerView
              attacks={attacks}
              onInspectTrace={() => setActiveTab("traces")}
            />
          )}
          {activeTab === "traces"  && <TraceInspectorView findings={findings} />}
          {activeTab === "compare" && (
            <DefenseComparisonView
              evaluations={evaluations}
              onRefresh={handleRunEvaluation}
              loading={evalLoading}
            />
          )}
          {activeTab === "audit"   && <PermissionAuditView auditItems={auditItems} loading={false} />}
        </div>
      </main>

      {/* ── Gemini API Key Modal ── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl fade-in"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <Key className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Configure Gemini API Key</div>
                <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Optional — enables live model evaluation</div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mt-3 mb-4" style={{ color: "var(--text-secondary)" }}>
              Your key is kept <strong className="text-amber-300">in memory only</strong> and is never saved to disk or localStorage.
              Without a key, AgentBreak operates on the deterministic mock model at zero cost.
            </p>

            <div>
              <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>GEMINI_API_KEY</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                placeholder="AIzaSy..."
                className="w-full rounded-lg px-3 py-2.5 text-sm font-mono outline-none transition"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-sans transition"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-lg text-sm font-sans font-medium text-white transition"
                style={{ background: "#C41E1E", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#DC2626")}
                onMouseLeave={e => (e.currentTarget.style.background = "#C41E1E")}
              >
                Save In Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
