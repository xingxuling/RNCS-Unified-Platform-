// Aether Local Execution Gateway · 浏览器侧客户端
// 严格只与 127.0.0.1:18771 通信；不携带 Cookie；不上传敏感数据。
import {
  LOCAL_GATEWAY_DEFAULT_URL,
  type GatewayDryRunRequest,
  type GatewayDryRunResult,
  type GatewayEnvCheck,
  type GatewayHealth,
  type GatewayLogResponse,
  type GatewayRunRequest,
  type GatewayRunResponse,
  type GatewayStatusResponse,
} from "./localGatewayTypes";

const STORAGE_KEY = "aether.local-execution-gateway.config.v0_1";

interface GatewayConfig {
  baseUrl: string;
}

export function loadGatewayConfig(): GatewayConfig {
  if (typeof window === "undefined") return { baseUrl: LOCAL_GATEWAY_DEFAULT_URL };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GatewayConfig>;
      return { baseUrl: parsed.baseUrl || LOCAL_GATEWAY_DEFAULT_URL };
    }
  } catch {/* ignore */}
  return { baseUrl: LOCAL_GATEWAY_DEFAULT_URL };
}

export function saveGatewayConfig(cfg: GatewayConfig) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch {/* ignore */}
}

async function gatewayFetch<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const cfg = loadGatewayConfig();
  const url = cfg.baseUrl.replace(/\/$/, "") + path;
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 5000);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      credentials: "omit",
    });
    if (!res.ok) throw new Error(`本地网关响应异常：HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function pingGateway(): Promise<{ ok: boolean; health?: GatewayHealth; reason?: string }> {
  try {
    const h = await gatewayFetch<GatewayHealth>("/health", { method: "GET", timeoutMs: 1500 });
    return { ok: h.status === "OK" && h.gateway === "AETHER_LOCAL_GATEWAY", health: h };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

export async function checkGatewayEnv(): Promise<GatewayEnvCheck | null> {
  try { return await gatewayFetch<GatewayEnvCheck>("/env/check", { method: "GET", timeoutMs: 8000 }); }
  catch { return null; }
}

export async function gatewayDryRun(req: GatewayDryRunRequest): Promise<GatewayDryRunResult | null> {
  try {
    return await gatewayFetch<GatewayDryRunResult>("/training/dry-run", {
      method: "POST", body: JSON.stringify(req), timeoutMs: 5000,
    });
  } catch { return null; }
}

export async function gatewayRunTraining(req: GatewayRunRequest): Promise<GatewayRunResponse> {
  try {
    return await gatewayFetch<GatewayRunResponse>("/training/run", {
      method: "POST", body: JSON.stringify(req), timeoutMs: 8000,
    });
  } catch (e) { return { ok: false, reason: (e as Error).message }; }
}

export async function gatewayGetLogs(runId: string): Promise<GatewayLogResponse | null> {
  try { return await gatewayFetch<GatewayLogResponse>(`/training/logs/${encodeURIComponent(runId)}`, { method: "GET", timeoutMs: 4000 }); }
  catch { return null; }
}

export async function gatewayGetStatus(runId: string): Promise<GatewayStatusResponse | null> {
  try { return await gatewayFetch<GatewayStatusResponse>(`/training/status/${encodeURIComponent(runId)}`, { method: "GET", timeoutMs: 3000 }); }
  catch { return null; }
}

export async function gatewayCancel(runId: string): Promise<boolean> {
  try {
    const r = await gatewayFetch<{ ok: boolean }>(`/training/cancel/${encodeURIComponent(runId)}`, { method: "POST", timeoutMs: 3000 });
    return !!r.ok;
  } catch { return false; }
}
