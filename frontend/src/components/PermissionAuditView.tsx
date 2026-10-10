"use client";

import React from "react";
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Terminal, 
  FileCode,
  Layers,
  ArrowRight
} from "lucide-react";
import { PermissionAuditItem } from "@/types";

interface PermissionAuditViewProps {
  auditItems: PermissionAuditItem[];
  loading: boolean;
}

export default function PermissionAuditView({
  auditItems,
  loading,
}: PermissionAuditViewProps) {
  const overPermissioned = auditItems.filter((i) => i.over_permissioned);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-zinc-800 bg-[#121620] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-zinc-100">Permission &amp; Capability Least-Privilege Audit</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-amber-950/70 text-amber-300 border border-amber-800/50">
                Section 9.4 Invariant
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Audits the principle of least privilege by cross-referencing <strong>Declared Permissions</strong> in agent metadata against <strong>Actually Used Tools</strong> across legitimate workflows and <strong>Reachable Attack Surface</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs">
            <span className="text-zinc-500">Flagged Tools:</span>
            <span className="text-amber-400 font-bold">{overPermissioned.length} of {auditItems.length}</span>
          </div>
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="bg-[#121620] border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Tool Permission Matrix</h2>
          </div>
          <span className="text-xs font-mono text-zinc-500">Customer Support Agent Scope</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#0E111A] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Tool Name</th>
                <th className="py-3 px-4 text-center">Declared in Scope</th>
                <th className="py-3 px-4 text-center">Used by Benign Tasks</th>
                <th className="py-3 px-4 text-center">Reachable in Runtime</th>
                <th className="py-3 px-4 text-center">Audit Assessment</th>
                <th className="py-3 px-4">Remediation / Scope Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs font-mono">
              {auditItems.length > 0 ? (
                auditItems.map((item) => {
                  const isFlagged = item.over_permissioned;

                  return (
                    <tr 
                      key={item.tool_name}
                      className={`hover:bg-zinc-800/30 transition ${
                        isFlagged ? "bg-amber-950/10" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-zinc-200">
                        {item.tool_name}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300">
                          {item.declared ? "YES" : "NO"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          item.used 
                            ? "bg-blue-950 text-blue-300 border border-blue-800/50" 
                            : "bg-zinc-900 text-zinc-500"
                        }`}>
                          {item.used ? "YES (Active)" : "NO (Unused)"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.reachable ? "text-amber-400" : "text-zinc-500"
                        }`}>
                          {item.reachable ? "REACHABLE" : "CONTAINED"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isFlagged ? (
                          <span className="flex items-center justify-center gap-1.5 text-amber-400 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Over-Permissioned</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Least Privilege</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300 font-sans text-xs">
                        {item.scope_notes}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    Loading capability audit matrix...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Architecture Principle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#121620] border border-zinc-800/80 rounded-xl p-5">
          <h3 className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-2 uppercase">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Why Unused Tools Are Dangerous</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
            In our threat model, a support agent equipped with <code>http_request</code> or <code>execute_shell</code> never calls them during legitimate user interactions. However, an attacker exploiting indirect prompt injection in a user ticket can trick the agent into using these undeclared capabilities to exfiltrate private tokens.
          </p>
        </div>

        <div className="bg-[#121620] border border-zinc-800/80 rounded-xl p-5">
          <h3 className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-2 uppercase">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Deterministic Mitigation</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
            Applying the principle of least privilege: remove <code>execute_shell</code> and <code>http_request</code> from the declared tool registry entirely. An agent cannot be coerced into calling tools that are not exposed to its dispatch environment.
          </p>
        </div>
      </div>
    </div>
  );
}
