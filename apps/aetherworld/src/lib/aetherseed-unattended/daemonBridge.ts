// AetherSeed Unattended Training Factory · 本地守护器桥
import type { DaemonStatus } from "./unattendedTypes";

export interface DaemonHealth {
  status: DaemonStatus;
  detected: boolean;
  baseUrl?: string;
  message: string;
  lastCheckedAt: string;
}

const DEFAULT_GATEWAY = "http://localhost:18777";

export async function checkDaemonHealth(baseUrl: string = DEFAULT_GATEWAY): Promise<DaemonHealth> {
  const now = new Date().toISOString();
  if (typeof fetch === "undefined") {
    return {
      status: "DAEMON_OFFLINE",
      detected: false,
      message: "当前环境无 fetch，无法检测本地守护器",
      lastCheckedAt: now,
    };
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`${baseUrl}/daemon/health`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      return {
        status: "DAEMON_READY",
        detected: true,
        baseUrl,
        message: "已检测到本地训练守护器（local-gateway）",
        lastCheckedAt: now,
      };
    }
    return {
      status: "DAEMON_OFFLINE",
      detected: false,
      baseUrl,
      message: `本地守护器返回 ${res.status}，可能未启用无人值守模块`,
      lastCheckedAt: now,
    };
  } catch {
    return {
      status: "DAEMON_OFFLINE",
      detected: false,
      baseUrl,
      message: "未检测到本地守护器：请在本机运行 local-gateway，否则训练进程将无法持续",
      lastCheckedAt: now,
    };
  }
}
