const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

let apiKey: string | null = null;

export function setApiKey(key: string) {
  apiKey = key;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
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
    return request<any[]>("/evaluations");
  },

  async runEvaluation() {
    return request<{ summaries: any[] }>("/evaluations", {
      method: "POST",
    });
  },
};
