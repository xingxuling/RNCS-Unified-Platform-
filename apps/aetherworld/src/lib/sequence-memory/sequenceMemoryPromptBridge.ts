// 数列记忆 → Prompt 注入片段
import type { SequenceMemoryUnit } from "./sequenceMemoryTypes";

export function buildSequenceMemoryPrompt(units: SequenceMemoryUnit[]): string {
  if (!units.length) return "";
  const lines: string[] = [];
  lines.push("【数列记忆 · 已压缩历史摘要】");
  lines.push("以下是与本轮相关的历史压缩摘要，请将其视为已发生事实，避免重复询问已确认信息：");
  units.forEach((u, i) => {
    lines.push(`${i + 1}. [${u.sequenceCode}] ${u.title}`);
    u.summary.split("\n").forEach((line) => lines.push(`   ${line}`));
  });
  lines.push("禁止把上述摘要当作密钥或敏感原文展开。如需原文，请提示用户重新提供。");
  return lines.join("\n");
}
