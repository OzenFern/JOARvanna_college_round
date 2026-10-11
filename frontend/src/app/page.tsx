"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Box,
  RotateCcw,
  Sparkles,
  Database,
  LogIn,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { api, setApiKey } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured as supabaseConfigured } from "@/lib/supabase";
import { AttackResult, EvaluationSummary, PermissionAuditItem } from "@/types";
import DashboardView from "@/components/DashboardView";
import CampaignRunnerView from "@/components/CampaignRunnerView";
import TraceInspectorView from "@/components/TraceInspectorView";
import DefenseComparisonView from "@/components/DefenseComparisonView";
import PermissionAuditView from "@/components/PermissionAuditView";

type Tab = "dashboard" | "runner" | "traces" | "compare" | "audit";

const NAV_TABS = [
  { id: "dashboard", label: "Overview" },
  { id: "runner",    label: "Campaigns" },
  { id: "traces",    label: "Trace Inspector" },
  { id: "compare",   label: "Defense Matrix" },
  { id: "audit",     label: "Permissions" },
] as const;

export default function Home() {
  const { user, signOut, isAuthenticated } = useAuth();
  const [activeTab,     setActiveTab]     = useState<Tab>("dashboard");
  const [backendHealth, setBackendHealth] = useState<"ok" | "offline" | "connecting">("connecting");
  const [dbStatus,      setDbStatus]      = useState<{ engine: string; ready: boolean; configured: boolean } | null>(null);
  const [apiKeyInput,   setApiKeyInput]   = useState<string>("");
  const [showKeyModal,  setShowKeyModal]  = useState<boolean>(false);
  const [hasApiKey,     setHasApiKey]     = useState<boolean>(false);
  const [theme,         setTheme]         = useState<"light" | "dark">("light");

  // Load and apply theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("agentbreak_theme") as "light" | "dark" | null;
    const initialTheme = saved || "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("agentbreak_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Shared data state
  const [attacks,     setAttacks]     = useState<any[]>([]);
  const [findings,    setFindings]    = useState<AttackResult[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [policy,      setPolicy]      = useState<{ tool_allowlist?: string[]; registered_tools?: string[] } | null>(null);
  const [auditItems,  setAuditItems]  = useState<PermissionAuditItem[]>([]);
  const [evalLoading, setEvalLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [h, atks, fnds, audit, latestEval, dbStat, policyResult] = await Promise.allSettled([
        api.getHealth(),
        api.getAttacks(),
        api.getFindings(),
        api.getPermissionAudit(),
        api.getLatestEvaluation(),
        api.getDbStatus(),
        api.getPolicy(),
      ]);

      setBackendHealth(h.status === "fulfilled" ? "ok" : "offline");
      if (atks.status       === "fulfilled") setAttacks(atks.value);
      if (fnds.status       === "fulfilled") setFindings(fnds.value);
      if (audit.status      === "fulfilled") setAuditItems(audit.value);
      if (latestEval.status === "fulfilled" && latestEval.value.length > 0) {
        setEvaluations(latestEval.value);
      }
      if (dbStat.status     === "fulfilled") setDbStatus(dbStat.value);
      if (policyResult.status === "fulfilled") setPolicy(policyResult.value);
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
    <div className="min-h-screen relative z-10 flex flex-col">

      {/* ── Floating Pill Topbar (Matching Black Box reference) ── */}
      <div className="sticky top-4 z-40 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <header className="floating-topbar px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-6 h-6 rounded-md bg-[#1c1e2b] flex items-center justify-center text-white">
              <Box className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-[#1c1e2b]">
              agentbreak
            </span>
          </div>

          {/* Centered Pill Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-[#f6f6f4] p-1 rounded-full border border-[#e9e8e4]">
            {NAV_TABS.map(({ id, label }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as Tab)}
                  className={`px-3.5 py-1 text-[13px] font-medium rounded-full transition-all ${
                    isActive
                      ? "bg-white text-[#1c1e2b] shadow-sm font-semibold"
                      : "text-[#5a5d6b] hover:text-[#1c1e2b]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Health Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#f6f6f4] border border-[#e9e8e4] text-[#5a5d6b]">
              <span className={`w-2 h-2 rounded-full ${
                backendHealth === "ok" ? "bg-emerald-500" : backendHealth === "offline" ? "bg-rose-500" : "bg-amber-400 animate-pulse"
              }`} />
              <span className="hidden sm:inline">API</span>
            </div>

            {/* Gemini Key Pill */}
            <button
              onClick={() => setShowKeyModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border transition ${
                hasApiKey
                  ? "bg-[#fdf0e5] border-[#f8d4bb] text-[#a24d17]"
                  : "bg-white border-[#e9e8e4] text-[#5a5d6b] hover:bg-[#f6f6f4]"
              }`}
            >
              <Key className="w-3 h-3" />
              <span>{hasApiKey ? "Gemini Active" : "Set Key"}</span>
            </button>

            {/* Sun / Moon Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1e2b] border border-[#e9e8e4] dark:border-[#272d3f] text-[#5a5d6b] dark:text-[#9ea7bd] hover:bg-[#f6f6f4] dark:hover:bg-[#232838] transition"
            >
              {theme === "light" ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={loadData}
              title="Refresh data"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1e2b] border border-[#e9e8e4] dark:border-[#272d3f] text-[#5a5d6b] dark:text-[#9ea7bd] hover:bg-[#f6f6f4] dark:hover:bg-[#232838] transition"
            >
              <RefreshCw className="w-3 h-3" />
            </button>

            {/* Auth */}
            {supabaseConfigured && (
              isAuthenticated && user ? (
                <button
                  onClick={() => signOut()}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[#fbecea] text-[#b83a32] hover:opacity-80 transition"
                  title={`Sign out (${user.email})`}
                >
                  <LogOut className="w-3 h-3" />
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-3 py-1 rounded-full text-[12px] font-medium bg-[#1c1e2b] text-white hover:bg-[#31344a] transition"
                >
                  Sign in
                </Link>
              )
            )}
          </div>
        </header>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-center gap-1 mt-2.5 overflow-x-auto pb-1">
          {NAV_TABS.map(({ id, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  isActive
                    ? "bg-[#1c1e2b] text-white"
                    : "bg-white border border-[#e9e8e4] text-[#5a5d6b]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Container (max-w-5xl, editorial rhythm) ── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {activeTab === "dashboard" && (
          <DashboardView
            attackCount={attacks.length}
            evaluations={evaluations}
            policy={policy}
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
      </main>

      {/* ── Gemini Key Modal ── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#e9e8e4]">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-[#ee7b30]" />
              <h3 className="font-semibold text-base text-[#1c1e2b]">Configure Gemini API Key</h3>
            </div>
            <p className="text-xs text-[#5a5d6b] leading-relaxed mb-4">
              Your key is kept strictly in-memory per request and never stored in files or databases. Without a key, AgentBreak automatically uses deterministic mock adapter at zero cost.
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
              placeholder="AIzaSy..."
              className="w-full bg-[#f6f6f4] border border-[#e9e8e4] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#1c1e2b] outline-none focus:border-[#ee7b30] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="btn btn-sm btn-primary"
              >
                Save In Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clean Footer ── */}
      <footer className="border-t border-[#e9e8e4] py-8 text-center text-xs text-[#8a8c97]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>AgentBreak · Autonomous AI Red Team &amp; Invariant Verifier</span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px]">D0 Baseline vs D1+D2+D3 Hardened</span>
            <span>Zero Model Calls on Replay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
