// Constitutional Violation Detector
import { VIOLATION_TYPES, getViolationType, type ViolationSeverity } from "@/constants/constitution/constitutionalViolationTypes";
import { FORBIDDEN_CLAIMS } from "@/constants/constitution/forbiddenClaims";

export { VIOLATION_TYPES };

export interface ConstitutionalViolation {
  violationId: string;
  violationType: string;
  severity: ViolationSeverity;
  articleId: string;
  explanation: string;
  suggestedFix: string;
  blockRequired: boolean;
}

export interface DetectInput {
  targetType: "ENGINE_OUTPUT" | "KNOWLEDGE_ENTRY" | "CONSTANT" | "WORLD_EXPORT" | "CURRENCY_ENTRY" | "TERMINAL_COMMAND" | "SUBJECT_DATA";
  targetId: string;
  payload: Record<string, unknown>;
  subjectMode?: string;
  userRole?: string;
}

export function detectViolations(input: DetectInput): ConstitutionalViolation[] {
  const violations: ConstitutionalViolation[] = [];
  const p = input.payload;
  const text = JSON.stringify(p).toLowerCase();

  function push(type: string, explanation: string, fix: string) {
    const vt = getViolationType(type);
    if (!vt) return;
    violations.push({
      violationId: `${type}_${input.targetId}_${violations.length}`,
      violationType: type, severity: vt.defaultSeverity,
      articleId: vt.relatedArticles[0] ?? "A001",
      explanation, suggestedFix: fix, blockRequired: vt.blockRequired,
    });
  }

  // No metadata
  if (input.targetType === "ENGINE_OUTPUT" && !("subjectModeUsed" in p)) {
    push("NO_METADATA", "缺少 subjectModeUsed", "在输出 metadata 中添加 subjectModeUsed");
  }
  // No validation
  if (input.targetType === "ENGINE_OUTPUT" && !("validationPoints" in p)) {
    push("NO_VALIDATION_PATH", "缺少 validationPoints", "添加可测信号");
  }
  // Demo/Real mixing
  if (input.subjectMode === "DEMO" && (text.includes('"real"') || text.includes('"full_60"'))) {
    push("DEMO_REAL_MIXING", "Demo 模式输出包含 Real 数据标记", "强制 Subject Mode Gate 隔离");
  }
  // Forbidden claims
  for (const fc of FORBIDDEN_CLAIMS) {
    for (const pat of fc.pattern) {
      if (text.includes(pat.toLowerCase())) {
        push(fc.severity === "CRITICAL" ? "OVERCLAIM" : "BLACKBOX_FACT_CLAIM",
          `命中禁止表述：${pat}（${fc.reason}）`, "改为概率/建议措辞或拒绝输出");
        break;
      }
    }
  }
  // Currency financialization
  if (input.targetType === "CURRENCY_ENTRY") {
    const v = p as Record<string, unknown>;
    if (v.CASH_REDEEMABLE === true || v.TRANSFERABLE === true || v.INVESTMENT_ASSET === true) {
      push("CURRENCY_FINANCIALIZATION", "数列货币被金融化", "恢复非金融锁定常数");
    }
  }
  // World as reality
  if (input.targetType === "WORLD_EXPORT" && text.includes("real_world_fact")) {
    push("FICTION_AS_REALITY", "虚拟世界被标记为现实事实", "改为 FICTIONAL_LORE / PRODUCT_INTERNAL");
  }
  // Founder lock bypass
  if ((input.userRole === "PUBLIC_USER" || input.userRole === "ADVANCED_USER") && text.includes("founderlocked")) {
    if (text.includes("override") || text.includes("bypass")) {
      push("FOUNDER_LOCK_BYPASS", "普通用户试图绕过 Founder Lock", "拒绝操作");
    }
  }

  return violations;
}
