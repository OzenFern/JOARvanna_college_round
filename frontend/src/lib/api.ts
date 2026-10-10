const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

let apiKey: string | null = null;

export function setApiKey(key: string) {
  apiKey = key;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (apiKey) {
    headers["X-Gemini-Key"] = apiKey;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
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
