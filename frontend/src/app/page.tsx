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
  Eye,
  Sliders
} from "lucide-react";
import { api, setApiKey, getApiKey } from "@/lib/api";

type Tab = "dashboard" | "runner" | "traces" | "compare" | "audit";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [backendHealth, setBackendHealth] = useState<string>("connecting");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    // Check backend health
    api.getHealth()
      .then((data) => setBackendHealth(data.status))
      .catch(() => setBackendHealth("offline"));
  }, []);

  const handleSaveKey = () => {
    setApiKey(apiKeyInput);
    setHasApiKey(!!apiKeyInput.trim());
    setShowKeyModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0D13] text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-[#0E111A]/70 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 font-bold tracking-wider text-sm shadow-inner">
            AB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-wide text-zinc-100">AgentBreak</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                Red Team Platform
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">Autonomous AI Security &amp; Policy Verification</p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
            <span className={`h-2 w-2 rounded-full ${backendHealth === "ok" ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-red-500"}`} />
            <span className="text-zinc-400 font-mono text-[11px]">API:</span>
            <span className="font-mono text-zinc-200 text-[11px] font-medium">{backendHealth}</span>
          </div>

          <button
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition border ${
              hasApiKey 
                ? "bg-amber-950/40 text-amber-300 border-amber-600/40 hover:bg-amber-900/40" 
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? "Gemini Key (Active)" : "Set Gemini Key"}</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav className="border-b border-zinc-800/60 bg-[#0B0D13] px-6 flex items-center gap-1">
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
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition -mb-[1px] ${
                isActive
                  ? "border-red-500 text-zinc-100 bg-zinc-900/40"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-red-400" : "text-zinc-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Top Posture Banner */}
            <div className="rounded-xl border border-zinc-800 bg-[#121620] p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <span>Security Posture Overview</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-950/60 text-red-300 border border-red-800/40">
                      Unprotected Baseline Active
                    </span>
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                    Target Customer-Support Agent is sandboxed with mock tools. In baseline (D0), security rules exist only in the system prompt. Tool gateway and canary egress filter defenses are ready for testing.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-zinc-400">Total Attacks Tested</span>
                  <div className="text-2xl font-bold font-mono text-zinc-100">10 Scenarios</div>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-[#0E111A] border border-zinc-800/80 rounded-lg p-4">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Baseline Exploit Rate</span>
                  <div className="text-2xl font-bold font-mono text-red-400 mt-1">100.0%</div>
                  <p className="text-[11px] text-zinc-400 mt-1">10 of 10 attacks succeed under D0</p>
                </div>

                <div className="bg-[#0E111A] border border-zinc-800/80 rounded-lg p-4">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Defended Exploit Rate</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">0.0%</div>
                  <p className="text-[11px] text-zinc-400 mt-1">0 breaches under full stack (D1+D2+D3)</p>
                </div>

                <div className="bg-[#0E111A] border border-zinc-800/80 rounded-lg p-4">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Benign Task Pass Rate</span>
                  <div className="text-2xl font-bold font-mono text-blue-400 mt-1">100.0%</div>
                  <p className="text-[11px] text-zinc-400 mt-1">10/10 legitimate tasks pass</p>
                </div>

                <div className="bg-[#0E111A] border border-zinc-800/80 rounded-lg p-4">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Over-Permissioned Tools</span>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">2 Tools</div>
                  <p className="text-[11px] text-zinc-400 mt-1">Flagged by permission auditor</p>
                </div>
              </div>
            </div>

            {/* Core Principle Card */}
            <div className="rounded-xl border border-zinc-800/80 bg-[#0E111A] p-5">
              <div className="flex items-center gap-2 text-zinc-300 font-medium text-xs">
                <Sliders className="w-4 h-4 text-zinc-400" />
                <span>Deterministic Enforcement Rule</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                <strong className="text-zinc-200">The model proposes; trusted code authorizes.</strong> Every tool call passes through the pre-execution tool gateway. Prohibited actions are hard-stopped before any mock side-effect or data leak occurs.
              </p>
            </div>
          </div>
        )}

        {activeTab !== "dashboard" && (
          <div className="rounded-xl border border-zinc-800 bg-[#121620] p-8 text-center">
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
              View Loaded
            </h2>
            <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
              This module will display real data from the FastAPI backend as we implement Milestones M1 through M8.
            </p>
          </div>
        )}
      </main>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121620] border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Configure Gemini API Key (Optional)</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Per Section 11.2 of the PRD, your key is kept <strong>in memory only</strong> and is never saved to disk or localStorage. Without a key, AgentBreak operates completely on the deterministic mock model.
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">GEMINI_API_KEY</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#0B0D13] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 transition"
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
