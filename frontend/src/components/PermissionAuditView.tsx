"use client";

import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
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
    <div className="space-y-8 animate-fade-in">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="label mb-1 text-[#ee7b30]">Principle of Least Privilege</div>
          <h1 className="h1">Capability &amp; permission audit</h1>
          <p className="muted text-xs mt-1 max-w-xl">
            Detect over-permissioned tools exposed to the agent sandbox that are never invoked during legitimate customer workflows.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fbf3e3] border border-[#f5dfb8] text-xs font-mono text-[#946013]">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{overPermissioned.length} of {auditItems.length} tools over-permissioned</span>
        </div>
      </div>

      {/* ── Tool Permission Table ── */}
      <div className="card overflow-hidden bg-white">
        <div className="px-5 py-3 border-b border-[#e9e8e4] flex items-center justify-between">
          <span className="font-semibold text-xs text-[#1c1e2b]">Declared vs Used Capabilities</span>
          <span className="badge badge-neutral text-[10px]">Customer Support Agent</span>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Tool Name</th>
                <th className="text-center">Declared</th>
                <th className="text-center">Used in Tasks</th>
                <th className="text-center">Reachable Surface</th>
                <th className="text-center">Assessment</th>
                <th>Remediation Advice</th>
              </tr>
            </thead>
            <tbody>
              {auditItems.length > 0 ? (
                auditItems.map((item) => {
                  const isFlagged = item.over_permissioned;
                  return (
                    <tr
                      key={item.tool_name}
                      className={isFlagged ? "bg-[#fbf3e3]/30" : ""}
                    >
                      <td>
                        <span className="font-mono font-semibold text-xs text-[#1c1e2b]">
                          {item.tool_name}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-neutral text-[10px]">
                          {item.declared ? "YES" : "NO"}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${item.used ? "badge-pass" : "badge-neutral"} text-[10px]`}>
                          {item.used ? "Active" : "Unused"}
                        </span>
                      </td>
                      <td className="text-center font-mono text-xs">
                        <span className={item.reachable ? "text-[#ee7b30] font-semibold" : "text-[#8a8c97]"}>
                          {item.reachable ? "REACHABLE" : "CONTAINED"}
                        </span>
                      </td>
                      <td className="text-center">
                        {isFlagged ? (
                          <span className="badge badge-warn text-[10px]">
                            Over-Permissioned
                          </span>
                        ) : (
                          <span className="badge badge-pass text-[10px]">
                            Least Privilege
                          </span>
                        )}
                      </td>
                      <td className="text-xs text-[#5a5d6b]">
                        {item.scope_notes}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs font-mono text-[#8a8c97]">
                    {loading ? "Loading audit matrix..." : "No capability audit data available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Two Clean Explanatory Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card card-pad bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-[#ee7b30]" />
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[#1c1e2b]">
              Why excess tools are dangerous
            </h3>
          </div>
          <p className="text-xs text-[#5a5d6b] leading-relaxed">
            In our threat model, a support agent equipped with <code className="text-[#a24d17] bg-[#fdf0e5] px-1 py-0.5 rounded">http_request</code> or <code className="text-[#a24d17] bg-[#fdf0e5] px-1 py-0.5 rounded">execute_shell</code> never calls them in normal tasks. However, an indirect prompt injection in a customer ticket can coerce the LLM into invoking them to exfiltrate private credentials.
          </p>
        </div>

        <div className="card card-pad bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-[#3a3f9e]" />
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[#1c1e2b]">
              Deterministic Mitigation
            </h3>
          </div>
          <p className="text-xs text-[#5a5d6b] leading-relaxed">
            Strip unused tools from the registered dispatcher schema entirely. An LLM agent cannot be tricked into executing capabilities that do not exist in its sandbox boundary.
          </p>
        </div>
      </div>

    </div>
  );
}
