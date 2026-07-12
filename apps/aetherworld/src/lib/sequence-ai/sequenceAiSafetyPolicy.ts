// 数列 AI 安全策略：禁止 Full60 / Founder-only / 高风险动作
import type { SafetyStatus } from "./sequenceAiTypes";

const FULL60_HINT = /(Full60\s*原始|完整数列\s*泄露|输出.{0,4}Full60)/i;
const FOUNDER_LEAK = /(founder[-_ ]?only\s*原文|创始人专属\s*原文)/i;
const SECRET_LEAK = /(api[_\s-]?key|secret\s*token|token\s*[:=]\s*[a-z0-9]{16,})/i;
const FORBIDDEN = /(自动支付|真实支付|自动部署到生产|强制公开发布|绕过\s*QA|绕过\s*Secret\s*Guard)/i;

export interface SequenceAiSafetyVerdict {
  status: SafetyStatus;
  notes: string[];
}

export function checkSequenceAiSafety(input: string): SequenceAiSafetyVerdict {
  const notes: string[] = [];
  let status: SafetyStatus = "PASS";
  if (FULL60_HINT.test(input) || FOUNDER_LEAK.test(input)) {
    notes.push("禁止输出 Full60 / Founder-only 原文。");
    status = "BLOCK";
  }
  if (SECRET_LEAK.test(input)) {
    notes.push("检测到 Secret 形态文本，已阻断。");
    status = "BLOCK";
  }
  if (FORBIDDEN.test(input)) {
    notes.push("禁止自动支付 / 部署 / 公开发布 / 绕过 QA/Secret Guard。");
    status = "BLOCK";
  }
  if (status === "PASS" && /(预测|未来|风险|趋势)/.test(input)) {
    notes.push("预测结果为「结构化辅助判断」，不构成确定承诺。");
    status = "WARN";
  }
  return { status, notes };
}
