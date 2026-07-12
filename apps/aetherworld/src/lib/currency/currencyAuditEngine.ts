import { getLedger } from "./creditLedgerEngine";
import { runCurrencySafety } from "./currencySafetyGuard";
import type { SubjectMode } from "./rewardCalculationEngine";

export type CurrencyAuditSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CurrencyAuditIssue {
  severity: CurrencyAuditSeverity;
  issue: string;
  suggestedFix: string;
}

export interface CurrencyAuditResult {
  status: "PASS" | "WARN" | "FAIL";
  issues: CurrencyAuditIssue[];
  recommendations: string[];
  checkedAt: string;
  subjectMode: SubjectMode;
}

export function runCurrencyAudit(mode: SubjectMode, extraText = ""): CurrencyAuditResult {
  const issues: CurrencyAuditIssue[] = [];
  const ledger = getLedger(mode);

  // 1) 关键词扫描（说明 / 来源等）
  const corpus = [extraText, ...ledger.map((e) => `${e.description} ${e.safetyNotes.join(" ")}`)].join("\n");
  const safety = runCurrencySafety(corpus);
  for (const w of safety.warnings) {
    issues.push({ severity: "CRITICAL", issue: w, suggestedFix: "移除可提现 / 投资 / 升值字样；改用「内部积分 / 体验奖励」表达。" });
  }

  // 2) Demo / Real 混入
  const wrongMode = ledger.filter((e) => e.subjectMode !== mode);
  if (wrongMode.length > 0) {
    issues.push({ severity: "HIGH", issue: `账本中存在 ${wrongMode.length} 条不属于 ${mode} 模式的记录。`, suggestedFix: "清空异常记录或迁移到正确的主体模式账本。" });
  }

  // 3) Founder Credit 出现在非 Founder
  if (mode !== "FOUNDER" && ledger.some((e) => e.unitType === "FOUNDER_CREDIT")) {
    issues.push({ severity: "HIGH", issue: "非 Founder 账本出现 FOUNDER_CREDIT。", suggestedFix: "迁移到 Founder 账本或作废。" });
  }

  // 4) 异常膨胀（单 unit 单日 > 1000）
  const today = new Date().toISOString().slice(0, 10);
  const byUnitToday: Record<string, number> = {};
  for (const e of ledger.filter((x) => x.createdAt.startsWith(today) && x.direction === "EARN")) {
    byUnitToday[e.unitType] = (byUnitToday[e.unitType] ?? 0) + e.amount;
  }
  for (const [u, total] of Object.entries(byUnitToday)) {
    if (total > 1000) {
      issues.push({ severity: "MEDIUM", issue: `单位 ${u} 当日新增 ${total} 异常偏高。`, suggestedFix: "检查是否存在重复刷分或脚本调用。" });
    }
  }

  // 5) 重复刷分（同 sourceId / contributionType 当日 > 20）
  const dupMap = new Map<string, number>();
  for (const e of ledger.filter((x) => x.createdAt.startsWith(today))) {
    const k = `${e.contributionType}|${e.sourceId ?? "-"}`;
    dupMap.set(k, (dupMap.get(k) ?? 0) + 1);
  }
  for (const [k, n] of dupMap.entries()) {
    if (n > 20) issues.push({ severity: "MEDIUM", issue: `${k} 当日重复 ${n} 次，疑似刷分。`, suggestedFix: "对重复来源降级或拒绝奖励。" });
  }

  const recommendations: string[] = [];
  if (issues.length === 0) recommendations.push("当前账本健康，无需处理。");
  else recommendations.push("依据 severity 优先处理 CRITICAL 与 HIGH。", "运行 Recalculate Reward Ledger 后再次审计。");

  const status: CurrencyAuditResult["status"] = issues.some((i) => i.severity === "CRITICAL")
    ? "FAIL"
    : issues.length > 0
      ? "WARN"
      : "PASS";

  return { status, issues, recommendations, checkedAt: new Date().toISOString(), subjectMode: mode };
}
