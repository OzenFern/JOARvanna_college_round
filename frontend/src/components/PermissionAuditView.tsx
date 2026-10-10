"use client";

import React from "react";
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Lock, Layers
} from "lucide-react";
import { PermissionAuditItem } from "@/types";

interface PermissionAuditViewProps {
  auditItems: PermissionAuditItem[];
  loading: boolean;
}

export default function PermissionAuditView({ auditItems, loading }: PermissionAuditViewProps) {
  const overPermissioned = auditItems.filter(i => i.over_permissioned);

  return (
    <div className="space-y-5 fade-in">

      {/* ── Header Banner ── */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Permission &amp; Capability Least-Privilege Audit
              </h1>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider"
                style={{ background: "rgba(245,158,11,0.10)", color: "#FCD34D", border: "1px solid rgba(245,158,11,0.22)" }}>
                Least-Privilege Check
              </span>
            </div>
            <p className="text-xs mt-1.5 max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Audits the principle of least privilege by cross-referencing{" "}
              <strong className="font-medium text-amber-300">Declared Permissions</strong> in agent metadata against{" "}
              <strong className="font-medium text-blue-300">Actually Used Tools</strong> across legitimate workflows and{" "}
              <strong className="font-medium" style={{ color: "var(--text-primary)" }}>Reachable Attack Surface</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl shrink-0"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.20)" }}>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Flagged:</span>
            <span className="text-sm font-bold font-mono text-amber-400">{overPermissioned.length}</span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>of {auditItems.length} tools</span>
          </div>
        </div>
      </div>

      {/* ── Tool Permission Matrix Table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Tool Permission Matrix</h2>
          </div>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Customer Support Agent Scope</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left data-table">
            <thead>
              <tr>
                <th>Tool Name</th>
                <th className="text-center">Declared</th>
                <th className="text-center">Used (Benign)</th>
                <th className="text-center">Reachable</th>
                <th className="text-center">Assessment</th>
                <th>Remediation Notes</th>
              </tr>
            </thead>
            <tbody>
              {auditItems.length > 0 ? (
                auditItems.map(item => {
                  const isFlagged = item.over_permissioned;
                  return (
                    <tr key={item.tool_name}
                      style={isFlagged ? { background: "rgba(245,158,11,0.04)" } : undefined}>
                      <td>
                        <span className="font-mono font-semibold text-[12px]" style={{ color: "var(--text-primary)" }}>
                          {item.tool_name}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                          {item.declared ? "YES" : "NO"}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded"
                          style={item.used
                            ? { background: "rgba(59,130,246,0.10)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.20)" }
                            : { background: "rgba(255,255,255,0.03)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }
                          }>
                          {item.used ? "YES (Active)" : "NO (Unused)"}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`font-mono text-[10px] font-bold ${item.reachable ? "text-amber-400" : ""}`}
                          style={!item.reachable ? { color: "var(--text-muted)" } : undefined}>
                          {item.reachable ? "REACHABLE" : "CONTAINED"}
                        </span>
                      </td>
                      <td className="text-center">
                        {isFlagged ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            Over-Permissioned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Least Privilege
                          </span>
                        )}
                      </td>
                      <td className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "inherit" }}>
                        {item.scope_notes}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                        Loading capability audit matrix...
                      </div>
                    ) : "No audit data available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Security Principle Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <h3 className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            <Lock className="w-4 h-4 text-amber-400" />
            Why Unused Tools Are Dangerous
          </h3>
          <p className="text-xs mt-2.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            In our threat model, a support agent equipped with <code className="text-amber-300 bg-zinc-800 px-1 rounded">http_request</code> or{" "}
            <code className="text-amber-300 bg-zinc-800 px-1 rounded">execute_shell</code> never calls them during legitimate user
            interactions. However, an attacker exploiting indirect prompt injection in a user ticket
            can trick the agent into using these undeclared capabilities to exfiltrate private tokens.
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <h3 className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            <Layers className="w-4 h-4 text-blue-400" />
            Deterministic Mitigation
          </h3>
          <p className="text-xs mt-2.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Applying the principle of least privilege: remove{" "}
            <code className="text-blue-300 bg-zinc-800 px-1 rounded">execute_shell</code> and{" "}
            <code className="text-blue-300 bg-zinc-800 px-1 rounded">http_request</code> from the declared tool registry entirely.
            An agent cannot be coerced into calling tools that are not exposed to its dispatch environment.
          </p>
        </div>
      </div>
    </div>
  );
}
