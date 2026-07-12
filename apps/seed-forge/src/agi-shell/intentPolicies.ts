// src/agi-shell/intentPolicies.ts

export type IntentType = "STATUS" | "ADVANCE" | "RESET" | "HELP" | "UNKNOWN";

export interface ShellIntent {
  type: IntentType;
  steps?: number; // ADVANCE 时使用
}

const numPattern = /(\d+)/;

export function classifyIntent(input: string): ShellIntent {
  const lower = input.toLowerCase();

  // Help / 帮助
  if (
    lower.includes("help") ||
    lower.includes("怎么用") ||
    lower.includes("说明") ||
    lower.includes("使用方法") ||
    lower.includes("指令")
  ) {
    return { type: "HELP" };
  }

  // Status / 状态
  if (
    lower.includes("状态") ||
    lower.includes("现在") ||
    lower.includes("宇宙") ||
    lower.includes("收束度") ||
    lower.includes("overview") ||
    lower.includes("summary")
  ) {
    return { type: "STATUS" };
  }

  // Advance / 推进时间线
  if (
    lower.includes("前进") ||
    lower.includes("推进") ||
    lower.includes("往前") ||
    lower.includes("step") ||
    lower.includes("advance") ||
    lower.includes("next")
  ) {
    const m = lower.match(numPattern);
    const steps = m ? Math.max(1, parseInt(m[1], 10)) : 1;
    return { type: "ADVANCE", steps };
  }

  // Reset / 重置
  if (
    lower.includes("重置") ||
    lower.includes("reset") ||
    lower.includes("重新开始") ||
    lower.includes("从头") ||
    lower.includes("restart")
  ) {
    return { type: "RESET" };
  }

  return { type: "UNKNOWN" };
}

