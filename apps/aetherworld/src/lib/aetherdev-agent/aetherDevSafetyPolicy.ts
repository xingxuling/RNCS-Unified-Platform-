// AetherDev · 安全策略
// 默认 L3：可生成任务 / 提示词 / 只读检查命令；禁止写文件、删除、部署。
import type {
  DevAutomationLevel,
  DevCommandStatus,
  DevTask,
} from "./aetherDevTypes";

const READ_ONLY_COMMAND_WHITELIST: RegExp[] = [
  /^npx?\s+tsc\s+--noEmit\b/,
  /^npm\s+run\s+typecheck\b/,
  /^npm\s+run\s+lint\b/,
  /^npm\s+test\b/,
  /^npm\s+run\s+test\b/,
  /^npm\s+run\s+build\b/,
  /^route-check\b/,
];

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\brm\s+-rf?\b/,
  /\bgit\s+(push|reset|checkout|clean)\b/,
  /\bsudo\b/,
  /\bcurl\s+.+\s*\|\s*(sh|bash)/,
  /\b(supabase\s+db\s+push|wrangler\s+deploy|vercel\s+deploy)\b/,
];

export interface SafetyDecision {
  allowed: boolean;
  reason: string;
  fallbackStatus: DevCommandStatus;
}

export function evaluateCommandSafety(
  command: string,
  level: DevAutomationLevel,
): SafetyDecision {
  if (FORBIDDEN_PATTERNS.some((p) => p.test(command))) {
    return {
      allowed: false,
      reason: "命中禁止命令黑名单（删除 / 部署 / 提权 / 远程脚本）",
      fallbackStatus: "SKIPPED",
    };
  }
  if (level === "L0" || level === "L1" || level === "L2") {
    return {
      allowed: false,
      reason: `当前权限 ${level} 不允许执行任何命令，请提升到 L3 及以上`,
      fallbackStatus: "SKIPPED",
    };
  }
  if (!READ_ONLY_COMMAND_WHITELIST.some((p) => p.test(command))) {
    return {
      allowed: false,
      reason: "命令不在只读白名单内（仅允许 tsc / lint / test / build / route-check）",
      fallbackStatus: "SKIPPED",
    };
  }
  return { allowed: true, reason: "通过只读命令白名单", fallbackStatus: "PASS" };
}

export function requiresFounderConfirmation(task: DevTask, level: DevAutomationLevel): boolean {
  if (task.riskLevel === "HIGH") return true;
  if (level === "L5" || level === "L6") return task.riskLevel !== "LOW";
  return false;
}

export function canApplyPatch(level: DevAutomationLevel): boolean {
  // MVP：默认任何级别都不允许真实落盘，仅 L5/L6 允许构建预览数据。
  return false;
}

export function describeLevel(level: DevAutomationLevel): string {
  const map: Record<DevAutomationLevel, string> = {
    L0: "L0 · 仅观察",
    L1: "L1 · 生成开发任务",
    L2: "L2 · 生成 Codex / Cursor / VSCode 提示词",
    L3: "L3 · 执行只读检查命令",
    L4: "L4 · 生成 Patch 预览（不落盘）",
    L5: "L5 · 创始人确认后应用低风险 Patch（默认关闭）",
    L6: "L6 · 无人值守低风险自动修复（默认关闭）",
  };
  return map[level];
}
