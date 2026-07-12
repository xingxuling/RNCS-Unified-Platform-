import { VERSION_READINESS_RULES, type ReadinessRule } from "@/constants/version-leap/versionReadinessRules";

export interface ReleaseBlocker {
  ruleId: string;
  label: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  hint: string;
}

export interface ReleaseReadinessResult {
  status: "READY" | "WARN" | "BLOCKED";
  blockers: ReleaseBlocker[];
  warnings: string[];
  requiredActions: string[];
  recommendedVersion: string;
  passedCount: number;
  totalCount: number;
}

export interface ReadinessInput {
  qaCriticals?: number;
  uiCriticals?: number;
  docsCriticals?: number;
  textCriticals?: number;
  constantCriticals?: number;
  constitutionCriticals?: number;
  deadRoutes?: number;
  founderExposed?: boolean;
  full60HasPrivacy?: boolean;
  currencyNonFinancial?: boolean;
  worldNotReality?: boolean;
  quickStartOk?: boolean;
  examplesOk?: boolean;
  emptyStatesOk?: boolean;
  recalcStaleAcceptable?: boolean;
  releaseNotesGenerated?: boolean;
  recommendedVersion: string;
}

function fail(rule: ReadinessRule, hint?: string): ReleaseBlocker {
  return { ruleId: rule.id, label: rule.label, severity: rule.severityIfFail, hint: hint ?? rule.hint };
}

export function checkReleaseReadiness(i: ReadinessInput): ReleaseReadinessResult {
  const blockers: ReleaseBlocker[] = [];
  const warnings: string[] = [];
  const r = (id: string) => VERSION_READINESS_RULES.find((x) => x.id === id)!;

  if ((i.qaCriticals ?? 0) > 0) blockers.push(fail(r("QA_PASS"), `存在 ${i.qaCriticals} 项 CRITICAL。`));
  if ((i.uiCriticals ?? 0) > 0) blockers.push(fail(r("UI_NO_CRITICAL")));
  if ((i.docsCriticals ?? 0) > 0) blockers.push(fail(r("DOCS_NO_CRITICAL")));
  if ((i.textCriticals ?? 0) > 0) blockers.push(fail(r("TEXT_NO_CRITICAL")));
  if ((i.constantCriticals ?? 0) > 0) blockers.push(fail(r("CONSTANT_NO_CRITICAL")));
  if ((i.constitutionCriticals ?? 0) > 0) blockers.push(fail(r("CONSTITUTION_OK")));
  if ((i.deadRoutes ?? 0) > 0) blockers.push(fail(r("DEAD_ROUTES_ZERO")));
  if (i.founderExposed) blockers.push(fail(r("FOUNDER_NOT_EXPOSED")));
  if (i.full60HasPrivacy === false) blockers.push(fail(r("FULL60_PRIVACY")));
  if (i.currencyNonFinancial === false) blockers.push(fail(r("CURRENCY_NON_FIN")));
  if (i.worldNotReality === false) blockers.push(fail(r("WORLD_NOT_REALITY")));
  if (i.quickStartOk === false) blockers.push(fail(r("QUICK_START_OK")));
  if (i.examplesOk === false) blockers.push(fail(r("EXAMPLES_OK")));
  if (i.emptyStatesOk === false) blockers.push(fail(r("EMPTY_STATES_OK")));
  if (i.recalcStaleAcceptable === false) blockers.push(fail(r("RECALC_OK")));
  if (i.releaseNotesGenerated === false) blockers.push(fail(r("RELEASE_NOTES_OK")));

  const critical = blockers.filter((b) => b.severity === "CRITICAL");
  const highOrMed = blockers.filter((b) => b.severity === "HIGH" || b.severity === "MEDIUM");
  let status: "READY" | "WARN" | "BLOCKED" = "READY";
  if (critical.length) status = "BLOCKED";
  else if (highOrMed.length) status = "WARN";

  highOrMed.forEach((b) => warnings.push(`${b.label}：${b.hint}`));

  const requiredActions = blockers.map((b) => `[${b.severity}] ${b.label} → ${b.hint}`);
  return {
    status,
    blockers,
    warnings,
    requiredActions,
    recommendedVersion: i.recommendedVersion,
    passedCount: VERSION_READINESS_RULES.length - blockers.length,
    totalCount: VERSION_READINESS_RULES.length,
  };
}

export function defaultReadinessInput(recommendedVersion: string): ReadinessInput {
  return {
    qaCriticals: 0, uiCriticals: 0, docsCriticals: 0, textCriticals: 0,
    constantCriticals: 0, constitutionCriticals: 0, deadRoutes: 0,
    founderExposed: false, full60HasPrivacy: true, currencyNonFinancial: true,
    worldNotReality: true, quickStartOk: true, examplesOk: true,
    emptyStatesOk: true, recalcStaleAcceptable: true, releaseNotesGenerated: true,
    recommendedVersion,
  };
}
