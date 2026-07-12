// AetherSeed Auto Training Executor · 进程桥（安全占位）
// 浏览器环境下 NEEDS_LOCAL_GATEWAY；若存在 window.__AETHER_LOCAL_GATEWAY__ 才进入受控 IPC。

import type { AutoTrainingCommand } from "./autoTrainingTypes";

export type ProcessBridgeKind = "NONE" | "LOCAL_GATEWAY" | "ELECTRON_IPC";

export interface ProcessBridgeInfo {
  kind: ProcessBridgeKind;
  description: string;
}

export function detectProcessBridge(): ProcessBridgeInfo {
  if (typeof window === "undefined") {
    return { kind: "NONE", description: "服务端环境，无可用进程桥" };
  }
  const w = window as unknown as {
    __AETHER_LOCAL_GATEWAY__?: { spawn?: unknown };
    __AETHER_ELECTRON_IPC__?: { invoke?: unknown };
  };
  if (w.__AETHER_ELECTRON_IPC__?.invoke) {
    return { kind: "ELECTRON_IPC", description: "已检测到 Electron 安全 IPC" };
  }
  if (w.__AETHER_LOCAL_GATEWAY__?.spawn) {
    return { kind: "LOCAL_GATEWAY", description: "已检测到本地网关 spawn 接口" };
  }
  return { kind: "NONE", description: "未检测到本地网关 / Electron IPC（NEEDS_LOCAL_GATEWAY）" };
}

/** 受控执行（占位）：当前实现拒绝真实执行，只返回 BLOCKED。 */
export async function safeSpawn(_cmd: AutoTrainingCommand): Promise<{
  ok: false;
  reason: string;
}> {
  return {
    ok: false,
    reason: "当前环境未提供安全进程桥，命令仅作为预览，未真实执行。",
  };
}
