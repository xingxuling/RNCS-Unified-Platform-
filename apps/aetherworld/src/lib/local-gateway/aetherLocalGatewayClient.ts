// Aether Local Gateway Client
// 通过本地 Gateway（默认 http://localhost:18777）转发模型与状态请求。
// 前端不再必须直连 Ollama，规避 HTTPS→HTTP / CORS / OLLAMA_ORIGINS 问题。
import { getGatewayUrl, type LocalGatewayStatus } from "./localGatewayStatus";

export interface GatewayChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GatewayChatRequest {
  model: string;
  messages: GatewayChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface GatewayChatResponse {
  model: string;
  content: string;
  usage?: Record<string, unknown>;
  safetyNotes?: string[];
  source?: string; // 例如 "ollama@http://localhost:11435"
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 8000,
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`Gateway HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function pingGateway(baseUrl?: string): Promise<boolean> {
  const url = (baseUrl || getGatewayUrl()).replace(/\/$/, "") + "/health";
  try {
    const r = await fetchJson<{ status?: string }>(url, { method: "GET" }, 3000);
    return r?.status === "ok";
  } catch {
    return false;
  }
}

export async function getGatewayStatus(baseUrl?: string): Promise<LocalGatewayStatus> {
  const base = (baseUrl || getGatewayUrl()).replace(/\/$/, "");
  const nowIso = new Date().toISOString();
  try {
    const r = await fetchJson<Partial<LocalGatewayStatus>>(
      base + "/api/local/status",
      { method: "GET" },
      4000,
    );
    return {
      gateway: r.gateway || "GATEWAY_READY",
      ollama: r.ollama || "UNKNOWN",
      activeProvider: r.activeProvider || "none",
      activeBaseUrl: r.activeBaseUrl || "",
      models: r.models || [],
      version: r.version,
      message: r.message,
      checkedAt: nowIso,
    };
  } catch (e) {
    return {
      gateway: "GATEWAY_OFFLINE",
      ollama: "UNKNOWN",
      activeProvider: "none",
      activeBaseUrl: "",
      models: [],
      message: e instanceof Error ? e.message : String(e),
      checkedAt: nowIso,
    };
  }
}

export async function listGatewayModels(baseUrl?: string): Promise<string[]> {
  const base = (baseUrl || getGatewayUrl()).replace(/\/$/, "");
  try {
    const r = await fetchJson<{ models?: string[] }>(
      base + "/api/local/models",
      { method: "GET" },
      4000,
    );
    return r.models || [];
  } catch {
    return [];
  }
}

export async function discoverOllamaViaGateway(baseUrl?: string): Promise<{
  ok: boolean;
  baseUrl?: string;
  models: string[];
  message: string;
}> {
  const base = (baseUrl || getGatewayUrl()).replace(/\/$/, "");
  try {
    const r = await fetchJson<{
      ok: boolean;
      baseUrl?: string;
      models?: string[];
      message?: string;
    }>(base + "/api/local/ollama/discover", { method: "POST" }, 6000);
    return {
      ok: !!r.ok,
      baseUrl: r.baseUrl,
      models: r.models || [],
      message: r.message || (r.ok ? "已通过本地网关连接 Ollama。" : "未发现 Ollama。"),
    };
  } catch (e) {
    return {
      ok: false,
      models: [],
      message:
        e instanceof Error
          ? `本地网关未启动或不可达：${e.message}`
          : "本地网关未启动或不可达。",
    };
  }
}

export async function chatViaGateway(
  req: GatewayChatRequest,
  baseUrl?: string,
): Promise<GatewayChatResponse> {
  const base = (baseUrl || getGatewayUrl()).replace(/\/$/, "");
  const r = await fetchJson<GatewayChatResponse>(
    base + "/api/local/chat",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    },
    60000,
  );
  return r;
}
