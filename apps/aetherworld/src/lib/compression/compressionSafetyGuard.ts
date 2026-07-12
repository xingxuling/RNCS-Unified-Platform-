// 安全守卫
import { COMPRESSION_SAFETY_RULES, type CompressionSafetyRule } from "@/constants/compression/compressionSafetyRules";
import type { CompressedOutput } from "./hybridCompressionEngine";

export interface CompressionSafetyResult {
  passed: boolean;
  violations: { rule: CompressionSafetyRule; reason: string }[];
  notes: string[];
}

export function runCompressionSafety(
  out: CompressedOutput,
  ctx: { riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; audience: string; subjectMode: string },
): CompressionSafetyResult {
  const v: CompressionSafetyResult["violations"] = [];
  const rule = (id: string) => COMPRESSION_SAFETY_RULES.find(r => r.id === id)!;

  if ((ctx.riskLevel === "HIGH" || ctx.riskLevel === "CRITICAL") && out.safetyNotes.length === 0) {
    v.push({ rule: rule("KEEP_CRITICAL_RISK"), reason: "高风险输出未保留 safetyNotes。" });
  }
  if (out.nextActions.length === 0) v.push({ rule: rule("KEEP_NEXT_ACTIONS"), reason: "缺失 nextActions。" });
  if (out.validationPoints.length === 0) v.push({ rule: rule("KEEP_VALIDATION"), reason: "缺失 validationPoints。" });
  if (ctx.audience === "PLAIN_USER" && out.founderTrace) {
    v.push({ rule: rule("ISOLATE_FOUNDER"), reason: "普通用户视图包含 Founder Trace。" });
  }
  if (ctx.subjectMode === "DEMO" && /真实|实际|production/i.test(out.plainConclusion)) {
    v.push({ rule: rule("ISOLATE_DEMO_REAL"), reason: "Demo 输出表述为 Real 结论。" });
  }

  const notes = [
    "压缩输出用于可读化，不构成承诺。",
    "黑箱信号 = 模式摘要，不等于可验证事实。",
  ];
  return { passed: v.length === 0, violations: v, notes };
}
