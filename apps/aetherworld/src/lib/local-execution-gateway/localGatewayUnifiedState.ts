// Aetherworld Local Gateway · 统一状态源
// 所有页面（local-gateway / unattended-training / first-run-readiness / auto-training 等）
// 都应通过本模块读取本地网关状态，避免每个页面自行解释 env 检查结果导致状态不一致。

import { pingGateway, checkGatewayEnv } from "./localGatewayClient";
import type { GatewayEnvCheck, GatewayHealth } from "./localGatewayTypes";

export type PythonCommand = "python" | "python3" | "py" | "unknown";

export type DaemonMode = "GATEWAY_COMPAT" | "DEDICATED_DAEMON" | "OFFLINE";

export interface LocalGatewayStatus {
  connected: boolean;
  gatewayName: string;
  version: string;
  baseUrl: string;
  healthOk: boolean;

  node: { ok: boolean; version?: string };
  python: { ok: boolean; command: PythonCommand; version?: string };
  /** python3 在 Windows 下常缺失；仅作为 WARN，不阻断。 */
  python3: { ok: boolean; version?: string; warningOnly: boolean };

  workingDirectoryOk: boolean;
  outputsOk: boolean;
  logsOk: boolean;
  checkpointsOk: boolean;

  daemon: {
    available: boolean;
    mode: DaemonMode;
    message: string;
  };

  /** 综合结论：可执行 dry-run / 训练。python3 缺失不应阻断。 */
  readyToRun: boolean;
  /** 阻断原因（仅严重缺失才填）。 */
  blockingReasons: string[];
  /** 仅提示的告警（如 python3 在 Windows 缺失）。 */
  warnings: string[];

  reason?: string;
  lastCheckedAt: string;
  /** 原始 env checks，便于详细 UI 展示。 */
  rawEnv?: GatewayEnvCheck;
  rawHealth?: GatewayHealth;
}

function detectIsWindowsLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = ((navigator as Navigator & { platform?: string }).platform || "").toLowerCase();
  return ua.includes("windows") || plat.includes("win");
}

function findCheck(env: GatewayEnvCheck | null, name: string) {
  return env?.checks.find((c) => c.name === name);
}

export function buildOfflineStatus(reason: string, baseUrl = ""): LocalGatewayStatus {
  return {
    connected: false,
    gatewayName: "AETHER_LOCAL_GATEWAY",
    version: "",
    baseUrl,
    healthOk: false,
    node: { ok: false },
    python: { ok: false, command: "unknown" },
    python3: { ok: false, warningOnly: true },
    workingDirectoryOk: false,
    outputsOk: false,
    logsOk: false,
    checkpointsOk: false,
    daemon: {
      available: false,
      mode: "OFFLINE",
      message: "本地执行网关未连接（请先在 local-gateway 目录启动 npm run local-gateway）。",
    },
    readyToRun: false,
    blockingReasons: ["本地执行网关未连接"],
    warnings: [],
    reason,
    lastCheckedAt: new Date().toISOString(),
  };
}

/** 统一状态查询：所有页面唯一入口。 */
export async function getUnifiedLocalGatewayStatus(): Promise<LocalGatewayStatus> {
  const ping = await pingGateway();
  if (!ping.ok || !ping.health) {
    return buildOfflineStatus(ping.reason || "/health 未通过或未探测");
  }

  const env = await checkGatewayEnv();
  const isWin = detectIsWindowsLike();

  const node = findCheck(env, "node");
  const py = findCheck(env, "python");
  const py3 = findCheck(env, "python3");
  const wd = findCheck(env, "workingDirectory");
  const outputs = findCheck(env, "./outputs");
  const logs = findCheck(env, "./logs");
  const ckpt = findCheck(env, "./outputs/checkpoints");

  // python：只要 python 或 python3 任一可用即视为可用
  let pythonOk = !!py?.ok;
  let pythonCmd: PythonCommand = py?.ok ? "python" : "unknown";
  let pythonVer = py?.ok ? py?.detail : undefined;
  if (!pythonOk && py3?.ok) {
    pythonOk = true;
    pythonCmd = "python3";
    pythonVer = py3.detail;
  }

  // python3 缺失：Windows 下仅 WARN；其他平台也按 warningOnly 处理（避免误阻断，
  // 真正需要 python3 的命令会在 dry-run 阶段独立校验）
  const python3WarningOnly = true;

  const warnings: string[] = [];
  const blockingReasons: string[] = [];

  if (!pythonOk) blockingReasons.push("未检测到可用的 Python（python / python3 均不可用）");
  if (!node?.ok) blockingReasons.push("Node.js 不可用");
  if (!wd?.ok) blockingReasons.push("工作目录不可写");
  if (!outputs?.ok) blockingReasons.push("./outputs 目录不可写");
  if (!logs?.ok) blockingReasons.push("./logs 目录不可写");
  if (!ckpt?.ok) blockingReasons.push("./outputs/checkpoints 目录不可写");

  if (!py3?.ok) {
    warnings.push(
      isWin
        ? "python3 命令不可用（Windows 下可忽略，已自动使用 python）"
        : "python3 命令不可用（已自动使用 python）",
    );
  }

  const readyToRun = blockingReasons.length === 0;

  // daemon 兼容：网关已连接即视为 GATEWAY_COMPAT 模式
  const daemon = {
    available: true,
    mode: "GATEWAY_COMPAT" as DaemonMode,
    message: "本地执行网关已连接，可作为第一版训练守护器使用。专用 daemon 后续升级。",
  };

  return {
    connected: true,
    gatewayName: ping.health.gateway,
    version: ping.health.version,
    baseUrl: `${ping.health.host}:${ping.health.port}`,
    healthOk: true,
    node: { ok: !!node?.ok, version: node?.detail },
    python: { ok: pythonOk, command: pythonCmd, version: pythonVer },
    python3: { ok: !!py3?.ok, version: py3?.detail, warningOnly: python3WarningOnly },
    workingDirectoryOk: !!wd?.ok,
    outputsOk: !!outputs?.ok,
    logsOk: !!logs?.ok,
    checkpointsOk: !!ckpt?.ok,
    daemon,
    readyToRun,
    blockingReasons,
    warnings,
    lastCheckedAt: new Date().toISOString(),
    rawEnv: env ?? undefined,
    rawHealth: ping.health,
  };
}

/** 给 GatewayConnState（旧 UI）的派生映射。 */
export function deriveConnStateLabel(s: LocalGatewayStatus): {
  state: "READY" | "ENV_MISSING" | "PYTHON_MISSING" | "DISCONNECTED";
  label: string;
  tone: "ok" | "warn" | "error";
} {
  if (!s.connected) return { state: "DISCONNECTED", label: "未连接", tone: "error" };
  if (!s.python.ok) return { state: "PYTHON_MISSING", label: "Python 缺失", tone: "error" };
  if (s.blockingReasons.length > 0) return { state: "ENV_MISSING", label: "环境缺失", tone: "warn" };
  return { state: "READY", label: "可执行", tone: "ok" };
}
