// 压缩审计
import { COMPRESSION_RISK_TYPES } from "@/constants/compression/compressionRiskTypes";
import type { CompressedOutput } from "./hybridCompressionEngine";

export type CompressionAuditSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CompressionAuditIssue {
  id: string;
  label: string;
  severity: CompressionAuditSeverity;
  detail: string;
}

export interface CompressionAuditResult {
  status: "PASS" | "WARN" | "FAIL";
  issues: CompressionAuditIssue[];
  suggestedFixes: string[];
}

export function auditCompression(
  out: CompressedOutput,
  ctx: { riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; audience: string },
): CompressionAuditResult {
  const issues: CompressionAuditIssue[] = [];
  const find = (id: string) => COMPRESSION_RISK_TYPES.find(r => r.id === id);

  if ((ctx.riskLevel === "HIGH" || ctx.riskLevel === "CRITICAL") && out.safetyNotes.length === 0) {
    const r = find("HIDDEN_CRITICAL")!;
    issues.push({ id: r.id, label: r.label, severity: "CRITICAL", detail: "压缩后丢失了安全说明。" });
  }
  if (out.nextActions.length === 0) {
    const r = find("MISSING_ACTIONS")!;
    issues.push({ id: r.id, label: r.label, severity: "HIGH", detail: "缺少下一步动作。" });
  }
  if (out.validationPoints.length === 0) {
    const r = find("MISSING_VALIDATION")!;
    issues.push({ id: r.id, label: r.label, severity: "MEDIUM", detail: "缺少回验点。" });
  }
  if (ctx.audience === "PLAIN_USER" && out.founderTrace) {
    const r = find("LEAK_FOUNDER_TRACE")!;
    issues.push({ id: r.id, label: r.label, severity: "HIGH", detail: "普通用户视图泄露 Founder Trace。" });
  }
  if (out.plainConclusion.length > 600) {
    issues.push({ id: "OVER_SIMPLIFY", label: "压缩不足", severity: "LOW", detail: "结论过长，建议进一步压缩。" });
  }
  // 黑箱写成事实的粗检
  if (/必然|一定|保证|确定无疑/.test(out.plainConclusion)) {
    const r = find("BLACKBOX_AS_FACT")!;
    issues.push({ id: r.id, label: r.label, severity: "HIGH", detail: "结论中出现绝对化用词。" });
  }

  const status: CompressionAuditResult["status"] =
    issues.some(i => i.severity === "CRITICAL") ? "FAIL" :
    issues.length > 0 ? "WARN" : "PASS";

  const fixes = issues.map(i =>
    i.id === "HIDDEN_CRITICAL"     ? "在压缩输出中保留 ≥1 条 safetyNotes。" :
    i.id === "MISSING_ACTIONS"     ? "补充至少 1 个 primaryAction。" :
    i.id === "MISSING_VALIDATION"  ? "补充至少 1 个 validationPoint。" :
    i.id === "LEAK_FOUNDER_TRACE"  ? "对 PLAIN_USER 隐藏 founderTrace。" :
    i.id === "BLACKBOX_AS_FACT"    ? "将绝对化用词改为概率/倾向性表达。" :
    "缩短结论或提高 maxLength 限制。"
  );

  return { status, issues, suggestedFixes: fixes };
}
