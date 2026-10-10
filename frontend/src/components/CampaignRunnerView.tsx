"use client";

import React, { useState } from "react";
import { Terminal, Play, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { AttackResult } from "@/types";
import { api } from "@/lib/api";

interface CampaignRunnerViewProps {
  onInspectTrace?: (traceId?: string) => void;
  attacks: any[];
}

const SEVERITY_STYLE: Record<string, React.CSSProperties> = {
  CRITICAL: { background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.25)" },
  HIGH:     { background: "rgba(245,158,11,0.12)", color: "#FCD34D", border: "1px solid rgba(245,158,11,0.25)" },
  MEDIUM:   { background: "rgba(234,179,8,0.10)",  color: "#FDE047", border: "1px solid rgba(234,179,8,0.22)" },
  LOW:      { background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" },
};

export default function CampaignRunnerView({ onInspectTrace, attacks }: CampaignRunnerViewProps) {
  const [selectedDefense,  setSelectedDefense]  = useState("D0");
  const [selectedAdapter,  setSelectedAdapter]  = useState("mock");
  const [selectedAttacks,  setSelectedAttacks]  = useState<string[]>([]);
  const [trials,           setTrials]           = useState(1);
  const [loading,          setLoading]          = useState(false);
  const [results,          setResults]          = useState<AttackResult[]>([]);
  const [campaignStats,    setCampaignStats]    = useState<any>(null);
  const [error,            setError]            = useState<string | null>(null);

  const handleToggle = (id: string) =>
    setSelectedAttacks(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const handleSelectAll = () =>
    setSelectedAttacks(selectedAttacks.length === attacks.length ? [] : attacks.map(a => a.id));

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

  const selectStyle: React.CSSProperties = {
    background: "var(--bg-base)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "7px 12px",
    fontSize: "12px",
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
  };

  return (
    <div className="space-y-5 fade-in">

      {/* ── Configuration Panel ── */}
      <div className="rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              <Terminal className="w-5 h-5 text-red-400" />
              Red Team Campaign Runner
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Configure attacks, select defense layers, and launch an autonomous red-team evaluation.
            </p>
          </div>
          <button
            onClick={handleLaunch}
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
            <span>{loading ? "Executing..." : "Launch Campaign"}</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Config Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Active Defense
              </label>
              <select value={selectedDefense} onChange={e => setSelectedDefense(e.target.value)} style={selectStyle}>
                <option value="D0">D0 — Baseline (Prompt Only)</option>
                <option value="D1">D1 — Tool Gatekeeper</option>
                <option value="D2">D2 — Canary Egress Filter</option>
                <option value="D3">D3 — Content Sanitizer</option>
                <option value="D1+D2+D3">D1+D2+D3 — Full Stack</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Target Model Adapter
              </label>
              <select value={selectedAdapter} onChange={e => setSelectedAdapter(e.target.value)} style={selectStyle}>
                <option value="mock">Deterministic Mock (Free / Fast)</option>
                <option value="gemini">Gemini (Requires API Key)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Trials Per Attack
              </label>
              <input
                type="number" min={1} max={10} value={trials}
                onChange={e => setTrials(parseInt(e.target.value) || 1)}
                style={{ ...selectStyle, width: "100%" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
              />
            </div>
          </div>

          {/* Attack Picker */}
          <div className="pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                Selected Attacks ({selectedAttacks.length > 0 ? selectedAttacks.length : attacks.length} of {attacks.length}):
              </span>
              <button onClick={handleSelectAll} className="text-sm font-sans text-red-400 hover:text-red-300 transition">
                {selectedAttacks.length === attacks.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {attacks.map(atk => {
                const isSelected = selectedAttacks.includes(atk.id) || selectedAttacks.length === 0;
                return (
                  <button
                    key={atk.id}
                    onClick={() => handleToggle(atk.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono transition"
                    style={isSelected
                      ? { background: "rgba(255,255,255,0.08)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }
                      : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }
                    }
                  >
                    {atk.id}: {atk.name?.split(" ")[0]}
                  </button>
                );
              })}
              {attacks.length === 0 && (
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  Loading attacks from backend...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-mono flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Results Table ── */}
      {results.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                Campaign Outcomes ({results.length} Scenarios)
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                Defense: {selectedDefense}
              </span>
            </div>
            {campaignStats && (
              <div className="flex items-center gap-4 text-sm font-mono" style={{ color: "var(--text-muted)" }}>
                <span>Exploits:{" "}
                  <strong className={campaignStats.successful_exploits > 0 ? "text-red-400" : "text-emerald-400"}>
                    {campaignStats.successful_exploits} / {campaignStats.total_attacks}
                  </strong>
                </span>
                <span>Rate:{" "}
                  <strong className={campaignStats.exploit_rate > 0 ? "text-red-400" : "text-emerald-400"}>
                    {(campaignStats.exploit_rate * 100).toFixed(1)}%
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Attack</th>
                  <th>Surface</th>
                  <th>Result</th>
                  <th>Severity</th>
                  <th>Violations</th>
                  <th>Mutations</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const isExploit = r.successes > 0;
                  return (
                    <tr key={r.attack_id}>
                      <td>
                        <div className="font-mono font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{r.attack_id}</div>
                        <div className="text-xs max-w-[180px] truncate" style={{ color: "var(--text-muted)" }}>{r.name}</div>
                      </td>
                      <td>
                        <span className="font-mono text-xs uppercase px-2 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                          {r.surface}
                        </span>
                      </td>
                      <td>
                        {isExploit ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.22)" }}>
                            <AlertTriangle className="w-3.5 h-3.5" /> EXPLOIT CONFIRMED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ background: "rgba(16,185,129,0.10)", color: "#6EE7B7", border: "1px solid rgba(16,185,129,0.20)" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> BLOCKED
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
                          style={SEVERITY_STYLE[r.severity] || SEVERITY_STYLE.LOW}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="font-mono text-sm">
                        {r.violated_invariants.length > 0
                          ? <span className="text-red-400 font-bold">{r.violated_invariants.join(", ")}</span>
                          : <span style={{ color: "var(--text-muted)" }}>None</span>
                        }
                      </td>
                      <td className="font-mono text-sm">
                        {r.mutations_used.length > 0
                          ? <span className="text-amber-400">{r.mutations_used.join(", ")}</span>
                          : <span style={{ color: "var(--text-muted)" }}>Direct</span>
                        }
                      </td>
                      <td className="text-right">
                        {r.trace_ids.length > 0 && (
                          <button
                            onClick={() => onInspectTrace?.(r.trace_ids[0])}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition"
                            style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                          >
                            <Layers className="w-3.5 h-3.5 text-red-400" />
                            Inspect Trace
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
