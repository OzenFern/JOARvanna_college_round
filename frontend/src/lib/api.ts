const RAW_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = RAW_BASE.endsWith("/api/v1")
  ? RAW_BASE
  : `${RAW_BASE.replace(/\/$/, "")}/api/v1`;

let apiKey: string | null = null;

export function setApiKey(key: string) {
  apiKey = key.trim() || null;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> || {}),
  };

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `API error: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && data.detail) errorDetail = data.detail;
    } catch {
      // not JSON
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  async getHealth() {
    return request<{ status: string }>("/health");
  },

  async getAttacks() {
    return request<any[]>("/attacks");
  },

  async getFindings() {
    return request<any[]>("/findings");
  },

  async getPolicy() {
    return request<any>("/policy");
  },

  async getPermissionAudit() {
    return request<any[]>("/audit/permissions");
  },

  async getLatestEvaluation() {
    return request<any[]>("/evaluations/latest");
  },


  async runEvaluation() {
    return request<{ summaries: any[] }>("/evaluations/run", {
      method: "POST",
    });
  },

  async getDbStatus() {
    return request<{ engine: string; ready: boolean; configured: boolean }>("/db/status");
  },

  async listCampaigns() {
    return request<any[]>("/campaigns");
  },

  async startCampaign(payload: any) {
    return request<any>("/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getTrace(traceId: string) {
    return request<any>(`/traces/${traceId}`);
  },

  async replayTrace(traceId: string, targetDefense?: string) {
    return request<any>(`/traces/${traceId}/replay`, {
      method: "POST",
      body: JSON.stringify(targetDefense ? { target_defense: targetDefense } : {}),
    });
  },
};
