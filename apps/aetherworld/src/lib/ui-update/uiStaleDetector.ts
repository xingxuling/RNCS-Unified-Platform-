// UI Stale Detector
import { UI_MODULE_REGISTRY } from "./uiModuleRegistry";
import { generateAllQuickStarts } from "./quickStartGenerator";
import { emptyStateCoverage } from "./emptyStateGenerator";
import { exampleCoverage } from "./examplePromptBinder";

export type UIStaleSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface UIStaleItem {
  itemType: "QUICK_START" | "SIDEBAR" | "EMPTY_STATE" | "USAGE_EXAMPLE" | "SAFETY_NOTE" | "SUBJECT_BADGE" | "ROUTE";
  moduleId: string;
  reason: string;
  severity: UIStaleSeverity;
}

export interface UIStaleResult {
  staleItems: UIStaleItem[];
  severity: UIStaleSeverity;
  suggestedFixes: string[];
}

function maxSev(a: UIStaleSeverity, b: UIStaleSeverity): UIStaleSeverity {
  const order: UIStaleSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  return order.indexOf(a) > order.indexOf(b) ? a : b;
}

export function detectStaleUi(knownRoutes: Set<string>): UIStaleResult {
  const stale: UIStaleItem[] = [];
  let max: UIStaleSeverity = "LOW";

  // 1) 路由不存在
  for (const m of UI_MODULE_REGISTRY) {
    if (m.sidebarVisible && !knownRoutes.has(m.route)) {
      stale.push({ itemType: "ROUTE", moduleId: m.moduleId, reason: `路由不存在：${m.route}`, severity: "HIGH" });
      max = maxSev(max, "HIGH");
    }
  }

  // 2) Quick Start 缺失
  const qs = generateAllQuickStarts();
  (["PUBLIC", "ADVANCED", "FOUNDER"] as const).forEach((aud) => {
    for (const mid of qs[aud].missingModules) {
      stale.push({ itemType: "QUICK_START", moduleId: mid, reason: `${aud} Quick Start 缺失：${mid}`, severity: aud === "PUBLIC" ? "HIGH" : "MEDIUM" });
      max = maxSev(max, aud === "PUBLIC" ? "HIGH" : "MEDIUM");
    }
  });

  // 3) Empty State 缺失
  for (const mid of emptyStateCoverage().missing) {
    stale.push({ itemType: "EMPTY_STATE", moduleId: mid, reason: `空状态缺失：${mid}`, severity: "MEDIUM" });
    max = maxSev(max, "MEDIUM");
  }

  // 4) Usage Example 缺失（核心模块为 HIGH）
  for (const mid of exampleCoverage().missing) {
    const mod = UI_MODULE_REGISTRY.find((x) => x.moduleId === mid);
    const sev: UIStaleSeverity = mod?.priority === "CORE" ? "HIGH" : "MEDIUM";
    stale.push({ itemType: "USAGE_EXAMPLE", moduleId: mid, reason: `使用示例缺失：${mid}`, severity: sev });
    max = maxSev(max, sev);
  }

  // 5) Subject Badge / Safety Note
  for (const m of UI_MODULE_REGISTRY) {
    if (m.priority === "CORE" && !m.hasSubjectModeBadge) {
      stale.push({ itemType: "SUBJECT_BADGE", moduleId: m.moduleId, reason: `核心页面缺 SubjectModeBadge：${m.moduleId}`, severity: "HIGH" });
      max = maxSev(max, "HIGH");
    }
    const highRisk = m.category === "WORLD_ENGINE" || m.category === "FOUNDER" ||
      m.moduleId === "sequence-currency" || m.moduleId === "real-subject-setup";
    if (highRisk && !m.hasSafetyNote) {
      stale.push({ itemType: "SAFETY_NOTE", moduleId: m.moduleId, reason: `高风险模块缺 Safety Note：${m.moduleId}`, severity: "MEDIUM" });
      max = maxSev(max, "MEDIUM");
    }
  }

  const suggestedFixes = Array.from(new Set(stale.map((s) =>
    `修复 ${s.moduleId} 的 ${s.itemType}（${s.reason}）`)));

  return { staleItems: stale, severity: max, suggestedFixes };
}
