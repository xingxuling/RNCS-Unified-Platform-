import type { CommandRouteResult } from "./commandRouter";

export interface CommandCanvasQaResult {
  status: "READY" | "WARN" | "BLOCK";
  warnings: string[];
  blockedReasons: string[];
}

const DANGEROUS = [/\brm\s+-rf\b/i, /\bsudo\b/i, /FULL60/i, /FOUNDER_ONLY/i, /原始数列/, /api[_-]?key\s*=/i];

export function evaluateCommandQa(cmd: CommandRouteResult): CommandCanvasQaResult {
  const warnings: string[] = [];
  const blocked: string[] = [];
  for (const re of DANGEROUS) {
    if (re.test(cmd.rawCommand)) blocked.push(`命令含潜在不安全模式：${re}`);
  }
  if (cmd.intentType === "UNKNOWN") warnings.push("意图不明确，已回退到 Sequence AI。");
  return {
    status: blocked.length ? "BLOCK" : warnings.length ? "WARN" : "READY",
    warnings,
    blockedReasons: blocked,
  };
}
