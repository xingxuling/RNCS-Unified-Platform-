// Aether Local Execution Gateway · 类型定义
export const LOCAL_GATEWAY_DEFAULT_URL = "http://127.0.0.1:18771";

export type GatewayConnState =
  | "DISCONNECTED"   // 未连接
  | "CONNECTED"      // 已连接
  | "ENV_MISSING"    // 环境缺失
  | "PYTHON_MISSING" // Python 缺失
  | "DEPS_MISSING"   // 依赖缺失
  | "READY";         // 可执行

export const GATEWAY_CONN_STATE_LABEL: Record<GatewayConnState, string> = {
  DISCONNECTED: "未连接",
  CONNECTED: "已连接",
  ENV_MISSING: "环境缺失",
  PYTHON_MISSING: "Python 缺失",
  DEPS_MISSING: "依赖缺失",
  READY: "可执行",
};

export interface GatewayHealth {
  status: "OK";
  gateway: "AETHER_LOCAL_GATEWAY";
  version: string;
  host: string;
  port: number;
  boundAt: string;
}

export interface GatewayEnvCheckItem {
  name: string;
  ok: boolean;
  detail: string;
}

export interface GatewayEnvCheck {
  ok: boolean;
  checks: GatewayEnvCheckItem[];
}

export interface GatewayDryRunRequest {
  taskId: string;
  workingDirectory: string;
  executable: string;
  args: string[];
}

export interface GatewayDryRunResult {
  canRun: boolean;
  warnings: string[];
  blockedReasons: string[];
  commandPreview: string;
  whitelistLabel: string;
  environmentStatus: "READY" | "BLOCKED";
}

export interface GatewayRunRequest extends GatewayDryRunRequest {
  userConfirmed: true;
  timeoutSec?: number;
}

export interface GatewayRunResponse {
  ok: boolean;
  runId?: string;
  status?: string;
  reason?: string;
}

export interface GatewayLogEntry {
  level: "INFO" | "WARN" | "ERROR" | "SYSTEM";
  line: string;
  at: string;
}

export interface GatewayLogResponse {
  ok: boolean;
  runId: string;
  status: string;
  truncated: boolean;
  redacted: boolean;
  logs: GatewayLogEntry[];
}

export interface GatewayStatusResponse {
  ok: boolean;
  runId: string;
  taskId: string | null;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMEOUT";
  exitCode: number | null;
  startedAt: string;
  endedAt: string | null;
  label: string;
}
