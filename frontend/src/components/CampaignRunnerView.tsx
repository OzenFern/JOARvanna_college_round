"use client";

import React, { useState } from "react";
import { Terminal, Play, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Layers } from "lucide-react";
import { AttackResult } from "@/types";
import { api } from "@/lib/api";

interface CampaignRunnerViewProps {
  onInspectTrace: (traceId: string) => void;
  attacks: any[];
}

export default function CampaignRunnerView({ onInspectTrace, attacks }: CampaignRunnerViewProps) {
  const [selectedDefense, setSelectedDefense] = useState<string>("D0");
  const [selectedAdapter, setSelectedAdapter] = useState<string>("mock");
  const [selectedAttacks, setSelectedAttacks] = useState<string[]>([]);
  const [trials, setTrials] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<AttackResult[]>([]);
  const [campaignStats, setCampaignStats] = useState<any>(null);

  const handleToggleAttack = (id: string) => {
    setSelectedAttacks((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedAttacks.length === attacks.length) {
      setSelectedAttacks([]);
    } else {
      setSelectedAttacks(attacks.map((a) => a.id));
    }
  };

  const handleLaunch = async () => {
    setLoading(true);
    try {
      const payload = {
        attack_ids: selectedAttacks.length > 0 ? selectedAttacks : undefined,
        defense: selectedDefense,
        adapter: selectedAdapter,
        trials,
      };
      const data = await api.startCampaign(payload);
      setCampaignStats(data);
      setResults(data.results || []);
    } catch (err: any) {
      alert("Error starting campaign: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Panel */}
      <div className="rounded-xl border border-zinc-800 bg-[#121620] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h1 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-red-400" />
              <span>Red Team Campaign Runner</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Select attacks, configure active defense layers, and launch an autonomous red-team evaluation run.
            </p>
          </div>

          <button
            onClick={handleLaunch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono bg-red-600 hover:bg-red-500 text-white font-medium transition shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{loading ? "Executing Campaign..." : "Launch Campaign"}</span>
          </button>
        </div>

        {/* Configuration Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {/* Defense Selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
              Active Defense Configuration
            </label>
            <select
              value={selectedDefense}
              onChange={(e) => setSelectedDefense(e.target.value)}
              className="w-full bg-[#0B0D13] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
            >
              <option value="D0">D0 — Baseline (Unhardened Prompt Only)</option>
              <option value="D1">D1 — Tool Gatekeeper (Allowlists &amp; Thresholds)</option>
              <option value="D2">D2 — Canary Egress Filter (Canary Shield)</option>
              <option value="D3">D3 — Content Sanitizer &amp; Taint Rule</option>
              <option value="D1+D2+D3">D1+D2+D3 — Full Stack Defense (All Layers)</option>
            </select>
          </div>

          {/* Model Adapter Selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
              Target Model Adapter
            </label>
            <select
              value={selectedAdapter}
              onChange={(e) => setSelectedAdapter(e.target.value)}
              className="w-full bg-[#0B0D13] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
            >
              <option value="mock">Deterministic Mock Model (Default / Free / Fast)</option>
              <option value="gemini">Gemini Model (Requires in-memory API key)</option>
            </select>
          </div>

          {/* Trials Count */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
              Independent Trials Per Attack
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={trials}
              onChange={(e) => setTrials(parseInt(e.target.value) || 1)}
              className="w-full bg-[#0B0D13] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Quick Attack Picker */}
        <div className="mt-5 pt-4 border-t border-zinc-800/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-zinc-300">
              Selected Attacks ({selectedAttacks.length > 0 ? selectedAttacks.length : attacks.length} of {attacks.length}):
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs font-mono text-red-400 hover:text-red-300 transition"
            >
              {selectedAttacks.length === attacks.length ? "Deselect All" : "Select All 10"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {attacks.map((atk) => {
              const isSelected = selectedAttacks.includes(atk.id) || selectedAttacks.length === 0;
              return (
                <button
                  key={atk.id}
                  onClick={() => handleToggleAttack(atk.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition border ${
                    isSelected
                      ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                      : "bg-[#0B0D13] text-zinc-500 border-zinc-800/80 hover:text-zinc-400"
                  }`}
                >
                  {atk.id}: {atk.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Table Panel */}
      {results.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-[#121620] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#0E111A]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-200 font-semibold uppercase tracking-wider">
                Campaign Outcomes ({results.length} Scenarios)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                Defense: {selectedDefense}
              </span>
            </div>

            {campaignStats && (
              <div className="text-xs font-mono text-zinc-400 flex items-center gap-4">
                <span>
                  Exploits:{" "}
                  <strong className={campaignStats.successful_exploits > 0 ? "text-red-400" : "text-emerald-400"}>
                    {campaignStats.successful_exploits} / {campaignStats.total_attacks}
                  </strong>
                </span>
                <span>
                  Rate:{" "}
                  <strong className={campaignStats.exploit_rate > 0 ? "text-red-400" : "text-emerald-400"}>
                    {(campaignStats.exploit_rate * 100).toFixed(1)}%
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Attack</th>
                  <th className="py-2.5 px-4">Surface</th>
                  <th className="py-2.5 px-4">Result</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Violations</th>
                  <th className="py-2.5 px-4">Mutations</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 font-mono">
                {results.map((r) => {
                  const isExploit = r.successes > 0;
                  return (
                    <tr key={r.attack_id} className="hover:bg-zinc-900/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-200">{r.attack_id}</div>
                        <div className="text-[11px] text-zinc-400 max-w-xs truncate">{r.name}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {r.surface}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {isExploit ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-950/70 text-red-400 border border-red-800/40">
                            <AlertTriangle className="w-3 h-3" />
                            <span>EXPLOIT CONFIRMED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>BLOCKED BY POLICY</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.severity === "CRITICAL" ? "bg-red-900/60 text-red-300 border border-red-700" :
                          r.severity === "HIGH" ? "bg-amber-900/60 text-amber-300 border border-amber-700" :
                          r.severity === "MEDIUM" ? "bg-yellow-950/60 text-yellow-300 border border-yellow-800" :
                          "bg-zinc-800 text-zinc-400"
                        }`}>
                          {r.severity}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-400">
                        {r.violated_invariants.length > 0 ? (
                          <span className="text-red-400 font-bold">{r.violated_invariants.join(", ")}</span>
                        ) : (
                          <span className="text-zinc-600">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-zinc-400">
                        {r.mutations_used.length > 0 ? (
                          <span className="text-amber-400">{r.mutations_used.join(", ")}</span>
                        ) : (
                          <span className="text-zinc-600">Direct</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {r.trace_ids.length > 0 && (
                          <button
                            onClick={() => onInspectTrace(r.trace_ids[0])}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700"
                          >
                            <Layers className="w-3 h-3 text-red-400" />
                            <span>Inspect Trace</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
