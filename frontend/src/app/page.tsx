"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Terminal, 
  Activity, 
  Layers, 
  GitCompare, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sliders,
  Sparkles
} from "lucide-react";
import { api, setApiKey } from "@/lib/api";
import { AttackResult, EvaluationSummary, PermissionAuditItem } from "@/types";
import DashboardView from "@/components/DashboardView";
import CampaignRunnerView from "@/components/CampaignRunnerView";
import TraceInspectorView from "@/components/TraceInspectorView";
import DefenseComparisonView from "@/components/DefenseComparisonView";
import PermissionAuditView from "@/components/PermissionAuditView";

type Tab = "dashboard" | "runner" | "traces" | "compare" | "audit";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [backendHealth, setBackendHealth] = useState<string>("connecting");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  // Shared Data State
  const [attacks, setAttacks] = useState<any[]>([]);
  const [findings, setFindings] = useState<AttackResult[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [auditItems, setAuditItems] = useState<PermissionAuditItem[]>([]);
  const [evalLoading, setEvalLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load initial datasets
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [h, atks, fnds, audit, latestEval] = await Promise.allSettled([
        api.getHealth(),
        api.getAttacks(),
        api.getFindings(),
        api.getPermissionAudit(),
        api.getLatestEvaluation(),
      ]);

      if (h.status === "fulfilled") setBackendHealth(h.value.status);
      else setBackendHealth("offline");

      if (atks.status === "fulfilled") setAttacks(atks.value);
      if (fnds.status === "fulfilled") setFindings(fnds.value);
      if (audit.status === "fulfilled") setAuditItems(audit.value);
      if (latestEval.status === "fulfilled" && latestEval.value.length > 0) {
        setEvaluations(latestEval.value);
      }
    } catch (e) {
      console.error("Failed to load initial data", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRunEvaluation = async () => {
    setEvalLoading(true);
    try {
      const res = await api.runEvaluation();
      if ((res as any).summaries) {
        setEvaluations((res as any).summaries);
      }
      // Refresh findings as well
      const fnds = await api.getFindings();
      setFindings(fnds);
    } catch (err: any) {
      console.error("Evaluation failed", err);
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveKey = () => {
    setApiKey(apiKeyInput);
    setHasApiKey(!!apiKeyInput.trim());
    setShowKeyModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0D13] text-zinc-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-red-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-[#0E111A]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-md shadow-black/30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-600 to-red-950 border border-red-500/40 flex items-center justify-center text-white font-extrabold tracking-wider text-sm shadow-inner shadow-red-500/30">
            AB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-zinc-100">AgentBreak</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/60 font-semibold">
                Autonomous Red Team
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">Autonomous AI Security &amp; Deterministic Policy Gate</p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-red-400" : ""}`} />
          </button>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <span className={`h-2 w-2 rounded-full ${backendHealth === "ok" ? "bg-emerald-500 shadow-sm shadow-emerald-500/80 animate-pulse" : "bg-red-500"}`} />
            <span className="text-zinc-500 font-mono text-[11px]">API:</span>
            <span className="font-mono text-zinc-200 text-[11px] font-semibold">{backendHealth}</span>
          </div>

          <button
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
              hasApiKey 
                ? "bg-amber-950/40 text-amber-300 border-amber-600/50 hover:bg-amber-900/40" 
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? "Gemini Key (Active)" : "Set Gemini Key"}</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav className="border-b border-zinc-800/70 bg-[#0E111A]/40 backdrop-blur-sm px-6 flex items-center gap-1 overflow-x-auto">
        {[
          { id: "dashboard", label: "Dashboard", icon: Activity },
          { id: "runner", label: "Campaign Runner", icon: Terminal },
          { id: "traces", label: "Attack Traces", icon: Layers },
          { id: "compare", label: "Defense Comparison", icon: GitCompare },
          { id: "audit", label: "Permission Audit", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition -mb-[1px] whitespace-nowrap ${
                isActive
                  ? "border-red-500 text-zinc-100 bg-red-950/20 font-semibold shadow-sm"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-red-400" : "text-zinc-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fadeIn">
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
            onInspectTrace={(traceId) => {
              setSelectedTraceId(traceId);
              setActiveTab("traces");
            }}
          />
        )}

        {activeTab === "traces" && (
          <TraceInspectorView
            findings={findings}
            selectedTraceId={selectedTraceId}
            onReplaySuccess={loadData}
          />
        )}

        {activeTab === "compare" && (
          <DefenseComparisonView
            evaluations={evaluations}
            onRefresh={handleRunEvaluation}
            loading={evalLoading}
          />
        )}

        {activeTab === "audit" && (
          <PermissionAuditView
            auditItems={auditItems}
            loading={false}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-[#0B0D13] px-6 py-4 text-center text-xs font-mono text-zinc-500">
        AgentBreak &bull; Deterministic Tool Gateway &amp; Autonomous AI Red Team Security Testing Platform
      </footer>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121620] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-zinc-100 font-semibold text-sm">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Configure Gemini API Key (Optional)</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your API key is kept <strong className="text-zinc-200">in memory only</strong> and is never saved to disk or localStorage. Without an external key, AgentBreak runs completely on the built-in deterministic mock model adapter.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">GEMINI_API_KEY</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#0B0D13] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-1.5 rounded-lg text-xs font-mono bg-red-600 hover:bg-red-500 text-white font-medium transition shadow-sm"
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
