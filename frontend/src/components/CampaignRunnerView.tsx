"use client";

import React, { useState } from "react";
import { Terminal, Play, CheckCircle2, AlertTriangle, Layers, RotateCcw } from "lucide-react";
import { AttackResult } from "@/types";
import { api } from "@/lib/api";

interface CampaignRunnerViewProps {
  onInspectTrace?: (traceId?: string) => void;
  attacks: any[];
}

export default function CampaignRunnerView({ onInspectTrace, attacks }: CampaignRunnerViewProps) {
  const [selectedDefense, setSelectedDefense] = useState("D0");
  const [selectedAdapter, setSelectedAdapter] = useState("mock");
  const [selectedAttacks, setSelectedAttacks] = useState<string[]>([]);
  const [trials, setTrials] = useState(3);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AttackResult[]>([]);
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (id: string) =>
    setSelectedAttacks((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );

  const handleSelectAll = () =>
    setSelectedAttacks(selectedAttacks.length === attacks.length ? [] : attacks.map((a) => a.id));

  const handleLaunch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.startCampaign({
        attack_ids: selectedAttacks.length > 0 ? selectedAttacks : undefined,
        defense: selectedDefense,
        adapter: selectedAdapter,
        trials,
      });
      setCampaignStats(data);
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || "Campaign failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="label mb-1 text-[#ee7b30]">Automated Red Team Suite</div>
          <h1 className="h1">Run an adversarial campaign</h1>
          <p className="muted text-xs mt-1 max-w-xl">
            Select attack vectors, choose active defense layers, and launch autonomous multi-turn testing with adaptive mutations.
          </p>
        </div>

        <button
          onClick={handleLaunch}
          disabled={loading}
          className="btn btn-sm btn-primary self-start sm:self-auto"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3 h-3 fill-current" />
          )}
          <span>{loading ? "Executing trials..." : "Launch campaign"}</span>
        </button>
      </div>

      {/* ── Configuration Card ── */}
      <div className="card card-pad bg-white space-y-5">
        
        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label mb-1.5 block">Active Defense</label>
            <select
              value={selectedDefense}
              onChange={(e) => setSelectedDefense(e.target.value)}
              className="w-full bg-[#f6f6f4] border border-[#e9e8e4] rounded-xl px-3 py-2 text-xs font-mono text-[#1c1e2b] outline-none focus:border-[#ee7b30]"
            >
              <option value="D0">D0 — Baseline (Prompt Only)</option>
              <option value="D1">D1 — Tool Gatekeeper</option>
              <option value="D2">D2 — Canary Egress Filter</option>
              <option value="D3">D3 — Content Sanitizer</option>
              <option value="D1+D2+D3">D1+D2+D3 — Full Stack</option>
            </select>
          </div>

          <div>
            <label className="label mb-1.5 block">Model Adapter</label>
            <select
              value={selectedAdapter}
              onChange={(e) => setSelectedAdapter(e.target.value)}
              className="w-full bg-[#f6f6f4] border border-[#e9e8e4] rounded-xl px-3 py-2 text-xs font-mono text-[#1c1e2b] outline-none focus:border-[#ee7b30]"
            >
              <option value="mock">Deterministic Mock (Free / Fast)</option>
              <option value="gemini">Gemini Live (Requires Key)</option>
            </select>
          </div>

          <div>
            <label className="label mb-1.5 block">Trials Per Attack</label>
            <input
              type="number"
              min={1}
              max={10}
              value={trials}
              onChange={(e) => setTrials(parseInt(e.target.value) || 1)}
              className="w-full bg-[#f6f6f4] border border-[#e9e8e4] rounded-xl px-3 py-2 text-xs font-mono text-[#1c1e2b] outline-none focus:border-[#ee7b30]"
            />
          </div>
        </div>

        {/* Attack Selector Chips */}
        <div className="pt-4 border-t border-[#e9e8e4]">
          <div className="flex items-center justify-between mb-2">
            <span className="label">
              Selected Attacks ({selectedAttacks.length > 0 ? selectedAttacks.length : attacks.length} of {attacks.length})
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-[#ee7b30] hover:underline"
            >
              {selectedAttacks.length === attacks.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {attacks.map((atk) => {
              const isSelected = selectedAttacks.includes(atk.id) || selectedAttacks.length === 0;
              return (
                <button
                  key={atk.id}
                  onClick={() => handleToggle(atk.id)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition border ${
                    isSelected
                      ? "bg-[#1c1e2b] text-white border-[#1c1e2b]"
                      : "bg-[#f6f6f4] text-[#5a5d6b] border-[#e9e8e4] hover:bg-[#efefec]"
                  }`}
                >
                  {atk.id}: {atk.name?.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Error Box ── */}
      {error && (
        <div className="p-3.5 rounded-xl bg-[#fbecea] border border-[#b83a32]/20 text-[#b83a32] text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Campaign Outcomes Table ── */}
      {results.length > 0 && (
        <div className="card overflow-hidden bg-white">
          <div className="px-5 py-3 border-b border-[#e9e8e4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[#1c1e2b]">Campaign Outcomes</span>
              <span className="badge badge-neutral text-[10px]">{selectedDefense}</span>
            </div>

            {campaignStats && (
              <div className="flex items-center gap-3 text-xs font-mono text-[#5a5d6b]">
                <span>
                  Exploits:{" "}
                  <strong className={campaignStats.successful_exploits > 0 ? "text-[#b83a32]" : "text-[#2e6a4f]"}>
                    {campaignStats.successful_exploits} / {campaignStats.total_attacks}
                  </strong>
                </span>
                <span>
                  Rate:{" "}
                  <strong className={campaignStats.exploit_rate > 0 ? "text-[#b83a32]" : "text-[#2e6a4f]"}>
                    {(campaignStats.exploit_rate * 100).toFixed(1)}%
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Attack</th>
                  <th>Surface</th>
                  <th>Verdict</th>
                  <th>Severity</th>
                  <th>Violated Invariants</th>
                  <th>Mutations</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isExploit = r.successes > 0;
                  return (
                    <tr key={r.attack_id}>
                      <td>
                        <div className="font-mono font-semibold text-xs text-[#1c1e2b]">{r.attack_id}</div>
                        <div className="text-[11px] text-[#5a5d6b] truncate max-w-[180px]">{r.name}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral text-[10px]">{r.surface}</span>
                      </td>
                      <td>
                        <span className={`badge ${isExploit ? "badge-fail" : "badge-pass"}`}>
                          {isExploit ? "Exploit Confirmed" : "Blocked"}
                        </span>
                      </td>
                      <td>
                        <span className={`font-mono text-xs font-semibold ${
                          r.severity === "CRITICAL" ? "text-[#b83a32]" : "text-[#1c1e2b]"
                        }`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="font-mono text-xs">
                        {r.violated_invariants.length > 0 ? (
                          <span className="text-[#b83a32] font-semibold">{r.violated_invariants.join(", ")}</span>
                        ) : (
                          <span className="text-[#8a8c97]">None</span>
                        )}
                      </td>
                      <td className="font-mono text-xs text-[#5a5d6b]">
                        {r.mutations_used.length > 0 ? r.mutations_used.join(", ") : "Direct"}
                      </td>
                      <td className="text-right">
                        {r.trace_ids.length > 0 && (
                          <button
                            onClick={() => onInspectTrace?.(r.trace_ids[0])}
                            className="btn btn-sm btn-ghost text-[11px] font-mono text-[#ee7b30]"
                          >
                            Inspect trace
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
