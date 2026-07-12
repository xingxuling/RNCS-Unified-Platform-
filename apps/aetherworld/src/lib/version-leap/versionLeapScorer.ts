import { getChangeTypeMeta, type VersionChangeType } from "@/constants/version-leap/versionChangeTypes";
import { type VersionImpactScopeId } from "@/constants/version-leap/versionImpactScopes";
import { levelForScore, type VersionLeapLevel } from "@/constants/version-leap/versionLeapLevels";
import { analyzeImpact, impactSummary } from "./versionImpactAnalyzer";

export interface VersionLeapInput {
  changedFiles?: string[];
  changedModules: string[];
  changeTypes: VersionChangeType[];
  affectedScopes: VersionImpactScopeId[];
  qaResults?: { status?: string; criticalCount?: number; warnCount?: number };
  uiAuditResult?: { critical?: number; stale?: number };
  docsAuditResult?: { critical?: number };
  textAuditResult?: { critical?: number };
  constantAuditResult?: { critical?: number };
  constitutionAuditResult?: { critical?: number };
}

export interface VersionLeapScore {
  totalScore: number;
  leapLevel: VersionLeapLevel;
  affectedScopes: VersionImpactScopeId[];
  reasons: string[];
  requiredFollowUps: string[];
  forcedRules: string[];
}

const FORCED_MIN: Record<VersionLeapLevel, number> = {
  PATCH: 0, MINOR: 1, MAJOR: 2, LEAP: 3, GENERATION: 4,
};
const LEVEL_BY_INDEX: VersionLeapLevel[] = ["PATCH", "MINOR", "MAJOR", "LEAP", "GENERATION"];
function elevate(curr: VersionLeapLevel, min: VersionLeapLevel): VersionLeapLevel {
  return FORCED_MIN[min] > FORCED_MIN[curr] ? min : curr;
}

export function scoreVersionLeap(input: VersionLeapInput): VersionLeapScore {
  const breakdown = analyzeImpact(input.changeTypes, input.affectedScopes);
  const { totalWeight, scopeCount } = impactSummary(breakdown);

  const changeWeight = input.changeTypes.reduce((s, ct) => s + (getChangeTypeMeta(ct)?.weight ?? 0), 0);
  const moduleFactor = Math.min(input.changedModules.length * 0.04, 0.25);

  const penalty =
    (input.qaResults?.criticalCount ?? 0) * 0.08 +
    (input.uiAuditResult?.critical ?? 0) * 0.05 +
    (input.docsAuditResult?.critical ?? 0) * 0.04 +
    (input.textAuditResult?.critical ?? 0) * 0.04 +
    (input.constantAuditResult?.critical ?? 0) * 0.06 +
    (input.constitutionAuditResult?.critical ?? 0) * 0.06;

  let raw = totalWeight * 0.55 + changeWeight * 1.1 + moduleFactor - penalty;
  raw = Math.max(0, Math.min(1, raw));

  let level = levelForScore(raw);
  const forced: string[] = [];

  if (input.changeTypes.includes("CONSTITUTION_UPDATE")) { level = elevate(level, "MAJOR"); forced.push("宪法更新 ≥ MAJOR"); }
  if (input.changeTypes.includes("CONSTANT_UPDATE"))     { level = elevate(level, "MAJOR"); forced.push("常数更新 ≥ MAJOR"); }
  if (input.changeTypes.includes("SAFETY_RULE_UPDATE"))  { level = elevate(level, "MAJOR"); forced.push("安全规则更新 ≥ MAJOR"); }
  if (input.changeTypes.includes("SUBJECT_MODE_UPDATE")) { level = elevate(level, "MAJOR"); forced.push("主体模式更新 ≥ MAJOR"); }
  if (input.changeTypes.includes("ENGINE_ADDED"))        { level = elevate(level, "LEAP"); forced.push("新增系统级引擎 ≥ LEAP"); }
  if (input.changeTypes.includes("WORLD_ENGINE_LEAP"))   { level = elevate(level, "LEAP"); forced.push("世界引擎跃迁 ≥ LEAP"); }
  if (input.changeTypes.includes("PRODUCT_POSITIONING_CHANGE")) { level = elevate(level, "LEAP"); forced.push("产品定位变化 ≥ LEAP"); }
  const fullStack = ["UI", "DOCS", "TEXT", "QA"].every((s) => input.affectedScopes.includes(s as VersionImpactScopeId));
  if (fullStack) { level = elevate(level, "LEAP"); forced.push("UI/Docs/Text/QA 全部受影响 ≥ LEAP"); }
  if (input.changeTypes.includes("ARCHITECTURE_CHANGE") && input.changeTypes.includes("PRODUCT_POSITIONING_CHANGE")) {
    level = elevate(level, "GENERATION"); forced.push("架构 + 定位同时变化 = GENERATION");
  }

  const reasons = [
    `影响范围 ${scopeCount} 项 / 总权重 ${totalWeight.toFixed(2)}`,
    `变更类型 ${input.changeTypes.length} 项 / 权重 ${changeWeight.toFixed(2)}`,
    `变更模块 ${input.changedModules.length} 个 (factor ${moduleFactor.toFixed(2)})`,
    `罚分 ${penalty.toFixed(2)}`,
  ];

  const followUps: string[] = [];
  if (input.affectedScopes.includes("UI")) followUps.push("运行 Interface Audit。");
  if (input.affectedScopes.includes("TEXT")) followUps.push("运行 Text Audit。");
  if (input.affectedScopes.includes("DOCS")) followUps.push("运行 Docs Audit。");
  if (FORCED_MIN[level] >= 2) followUps.push("生成 Release Notes。");
  if (FORCED_MIN[level] >= 3) followUps.push("生成 Migration Plan 与 Rollback Plan。");
  if (FORCED_MIN[level] >= 4) followUps.push("更新产品定位文案与首屏。");

  return {
    totalScore: Number(raw.toFixed(3)),
    leapLevel: level,
    affectedScopes: input.affectedScopes,
    reasons,
    requiredFollowUps: followUps,
    forcedRules: forced,
  };
}

export { LEVEL_BY_INDEX };
