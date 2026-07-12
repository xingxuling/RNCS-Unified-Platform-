// Version Iteration Calculus — judges whether the system is truly v1.0 ready.
// Reads Beta Launch Calculus state and produces a release-gate verdict.

import {
  DEFAULT_VERSION_FACTOR_SCORES,
  type VersionFactorScores,
  type VersionPositiveFactorKey,
  type VersionNegativeFactorKey,
} from "@/constants/versionReadinessFactors";
import {
  MODULE_STABILITY_REGISTRY,
  type ModuleStabilityLevel,
} from "@/constants/moduleStabilityLevels";
import {
  computeBetaLaunch,
  type BetaLaunchResult,
  type BetaLaunchStatus,
} from "@/lib/betaLaunchCalculus";

export type VersionReleaseStatus =
  | "NOT_READY"
  | "V0_9_RC"
  | "V1_PRIVATE_BETA"
  | "V1_GUIDED_BETA"
  | "WAITLIST_ONLY";

export const VERSION_STATUS_META: Record<
  VersionReleaseStatus,
  { cn: string; en: string; desc: string }
> = {
  NOT_READY: {
    cn: "尚未准备好",
    en: "Not Ready",
    desc: "当前闭环或安全边界不足以进入候选版本。",
  },
  V0_9_RC: {
    cn: "v0.9 候选预备",
    en: "v0.9 Release Candidate",
    desc: "接近 v1.0，但仍需补齐文档、回验或安全边界。",
  },
  V1_PRIVATE_BETA: {
    cn: "v1.0 私密内测候选",
    en: "v1.0 Private Beta Candidate",
    desc: "已具备完整闭环，可进入 3–10 人私密内测。",
  },
  V1_GUIDED_BETA: {
    cn: "v1.0 引导式内测候选",
    en: "v1.0 Guided Beta Candidate",
    desc: "可进入 50–200 人引导式内测。",
  },
  WAITLIST_ONLY: {
    cn: "候补 / 公开预览候选",
    en: "Waitlist / Public Preview",
    desc: "可开放公开候补名单，仍保留高风险锁定。",
  },
};

export type GateCheckStatus = "PASS" | "WARNING" | "FAIL" | "NOT_APPLICABLE";

export interface GateCheckItem {
  id: string;
  cn: string;
  group: "CORE_LOOP" | "SAFETY" | "DOCS" | "BETA" | "UX" | "FEEDBACK";
  status: GateCheckStatus;
  detail?: string;
}

export interface VersionReadinessResult {
  versionReadinessScore: number; // 0-100
  positiveIndex: number;
  negativeIndex: number;
  recommendedVersion: string;
  canMarkAsV1: boolean;
  releaseStatus: VersionReleaseStatus;
  stableModules: string[];
  betaModules: string[];
  experimentalModules: string[];
  placeholderModules: string[];
  lockedModules: string[];
  releaseBlockers: string[];
  requiredFixesBeforeV1: string[];
  recommendedBetaScope: string;
  postV1Roadmap: string[];
  gateChecklist: GateCheckItem[];
  betaSnapshot: {
    status: BetaLaunchStatus;
    score: number;
    publicLaunchBlocked: boolean;
  };
  notes: string[];
}

export interface VersionIterationInput {
  factors?: Partial<VersionFactorScores>;
  betaResult?: BetaLaunchResult;
  gateOverrides?: Partial<Record<string, GateCheckStatus>>;
}

// ───────────────────────── weights ─────────────────────────

const POSITIVE_WEIGHTS: Record<VersionPositiveFactorKey, number> = {
  coreLoopCompleteness: 1.2,
  userJourneyCompletion: 1.0,
  calculationEngineStability: 1.0,
  feedbackLearningReadiness: 1.0,
  privacySafety: 1.2,
  documentationCompleteness: 0.9,
  betaLaunchReadiness: 1.0,
  regionalUXFit: 0.8,
  productCoherence: 0.9,
};

const NEGATIVE_WEIGHTS: Record<VersionNegativeFactorKey, number> = {
  featureFragmentation: 0.9,
  cognitiveOverload: 1.0,
  misuseRisk: 1.1,
  unverifiedClaims: 1.0,
};

function mergeScores(input?: Partial<VersionFactorScores>): VersionFactorScores {
  return { ...DEFAULT_VERSION_FACTOR_SCORES, ...(input ?? {}) };
}

function weightedAvg<K extends string>(
  scores: Record<K, number>,
  weights: Record<K, number>,
): number {
  const keys = Object.keys(weights) as K[];
  let num = 0;
  let den = 0;
  for (const k of keys) {
    num += (scores[k] ?? 0) * weights[k];
    den += weights[k];
  }
  return den > 0 ? num / den : 0;
}

function statusFromScore(score: number, betaBlocked: boolean): VersionReleaseStatus {
  if (betaBlocked) return score >= 60 ? "V0_9_RC" : "NOT_READY";
  if (score < 40) return "NOT_READY";
  if (score < 60) return "V0_9_RC";
  if (score < 75) return "V1_PRIVATE_BETA";
  if (score < 85) return "V1_GUIDED_BETA";
  return "WAITLIST_ONLY";
}

function recommendedVersionFor(status: VersionReleaseStatus): string {
  switch (status) {
    case "NOT_READY":
      return "v0.8";
    case "V0_9_RC":
      return "v0.9 RC";
    case "V1_PRIVATE_BETA":
      return "v1.0 Private Beta";
    case "V1_GUIDED_BETA":
      return "v1.0 Guided Beta";
    case "WAITLIST_ONLY":
      return "v1.0 → v2.0 Waitlist";
  }
}

function recommendedBetaScopeFor(status: VersionReleaseStatus): string {
  switch (status) {
    case "NOT_READY":
      return "暂不适合开放真实用户。";
    case "V0_9_RC":
      return "仅限创始人与 1–3 名核心可信用户进行收尾测试。";
    case "V1_PRIVATE_BETA":
      return "邀请 3–10 名可信用户进入 Private Alpha，目标 ≥ 30 条回验。";
    case "V1_GUIDED_BETA":
      return "扩展到 10–50 名筛选用户，要求强 onboarding 与回验提交率 ≥ 30%。";
    case "WAITLIST_ONLY":
      return "开放公开候补名单，分批发放，仍锁定高风险模块。";
  }
}

function postV1RoadmapFor(status: VersionReleaseStatus): string[] {
  const base = [
    "v1.1 · Beta UX Hardening — 简化 onboarding、降低术语门槛、增强地区 UX、优化移动端体验。",
    "v1.2 · Feedback Intelligence — 权重进化增强、事件命中统计、偏差诊断、个体学习报告。",
    "v1.3 · Real Subject Deep Mode — Full 60 高级分析、三循环回验、终端收束趋势、导出/删除完善。",
    "v1.4 · Prompt Strategy OS — Prompt Forge 深度升级、提示词效果回验、IDE 模式分化。",
    "v1.5 · Research Report Export — 个人预测、回验、方法论、匿名案例导出。",
    "v2.0 · Public Preview / Waitlist — 公开候补、Demo-first、轻量真实主体、不开放高风险强断。",
  ];
  if (status === "NOT_READY" || status === "V0_9_RC") {
    return [
      "优先完成 v1.0 闭环：补齐使用手册、安全边界、回验入口与 Demo / Real 隔离。",
      ...base,
    ];
  }
  return base;
}

// ───────────────────────── gate checklist ─────────────────────────

function evaluateGates(
  factors: VersionFactorScores,
  beta: BetaLaunchResult,
  overrides?: Partial<Record<string, GateCheckStatus>>,
): GateCheckItem[] {
  const pass = (cond: boolean, warn?: boolean): GateCheckStatus =>
    cond ? "PASS" : warn ? "WARNING" : "FAIL";

  const items: GateCheckItem[] = [
    // Core loop
    { id: "core.demo", cn: "可选择 Demo 主体", group: "CORE_LOOP", status: "PASS" },
    { id: "core.light20", cn: "可创建 Light 20 主体", group: "CORE_LOOP", status: "PASS" },
    { id: "core.calendar", cn: "可生成触发日历", group: "CORE_LOOP", status: "PASS" },
    { id: "core.detail", cn: "可查看预测详情", group: "CORE_LOOP", status: "PASS" },
    {
      id: "core.feedback",
      cn: "可提交回验",
      group: "CORE_LOOP",
      status: pass(factors.feedbackLearningReadiness >= 50, factors.feedbackLearningReadiness >= 30),
    },
    {
      id: "core.determinant",
      cn: "可查看定数判断",
      group: "CORE_LOOP",
      status: pass(factors.calculationEngineStability >= 55),
    },

    // Safety
    { id: "safety.boundary", cn: "存在安全边界页", group: "SAFETY", status: "PASS" },
    {
      id: "safety.isolation",
      cn: "Demo 与真实主体隔离",
      group: "SAFETY",
      status: pass(factors.privacySafety >= 70, factors.privacySafety >= 50),
    },
    {
      id: "safety.delete",
      cn: "可删除真实主体数据",
      group: "SAFETY",
      status: pass(factors.privacySafety >= 65),
    },
    { id: "safety.disclaimer", cn: "明确非医疗/法律/金融建议", group: "SAFETY", status: "PASS" },
    {
      id: "safety.assertions",
      cn: "阻止绝对断言文案",
      group: "SAFETY",
      status: pass(factors.unverifiedClaims <= 55, factors.unverifiedClaims <= 70),
    },

    // Documentation
    { id: "docs.overview", cn: "产品总览", group: "DOCS", status: "PASS" },
    { id: "docs.whitepaper", cn: "理论白皮书", group: "DOCS", status: "PASS" },
    {
      id: "docs.manual",
      cn: "使用手册",
      group: "DOCS",
      status: pass(factors.documentationCompleteness >= 65, factors.documentationCompleteness >= 50),
    },
    { id: "docs.calculus", cn: "计算法文档", group: "DOCS", status: "PASS" },
    { id: "docs.determinant", cn: "定数计算法文档", group: "DOCS", status: "PASS" },
    {
      id: "docs.feedback",
      cn: "回验规范",
      group: "DOCS",
      status: pass(factors.documentationCompleteness >= 60),
    },
    { id: "docs.roadmap", cn: "版本路线图", group: "DOCS", status: "PASS" },

    // Beta readiness
    {
      id: "beta.console",
      cn: "Beta Launch 页",
      group: "BETA",
      status: "PASS",
    },
    {
      id: "beta.segments",
      cn: "用户分层",
      group: "BETA",
      status: pass(beta.recommendedUserSegments.length > 0),
    },
    {
      id: "beta.access",
      cn: "访问等级",
      group: "BETA",
      status: pass(beta.recommendedAccessLevels.length > 0),
    },
    {
      id: "beta.lock",
      cn: "功能锁定",
      group: "BETA",
      status: pass(beta.lockedFeatures.length > 0),
    },
    {
      id: "beta.risk",
      cn: "风险门",
      group: "BETA",
      status: pass(!beta.publicLaunchBlocked, true),
      detail: beta.publicLaunchBlocked ? "存在高危风险，禁止公开发布。" : undefined,
    },

    // UX
    {
      id: "ux.regional",
      cn: "地区用户体验",
      group: "UX",
      status: pass(factors.regionalUXFit >= 55, factors.regionalUXFit >= 35),
    },
    {
      id: "ux.onboarding",
      cn: "onboarding 路径",
      group: "UX",
      status: pass(factors.userJourneyCompletion >= 55, factors.userJourneyCompletion >= 40),
    },
    {
      id: "ux.copy",
      cn: "文案适配",
      group: "UX",
      status: pass(factors.regionalUXFit >= 50, true),
    },
    {
      id: "ux.overload",
      cn: "认知过载提醒",
      group: "UX",
      status: pass(factors.cognitiveOverload <= 65, factors.cognitiveOverload <= 80),
    },

    // Feedback
    {
      id: "fb.center",
      cn: "回验中心",
      group: "FEEDBACK",
      status: pass(factors.feedbackLearningReadiness >= 50),
    },
    {
      id: "fb.weights",
      cn: "回验权重",
      group: "FEEDBACK",
      status: pass(factors.feedbackLearningReadiness >= 55, factors.feedbackLearningReadiness >= 40),
    },
    {
      id: "fb.evolution",
      cn: "个人模型进化分",
      group: "FEEDBACK",
      status: pass(factors.feedbackLearningReadiness >= 55, true),
    },
    {
      id: "fb.matrix",
      cn: "引擎权重矩阵",
      group: "FEEDBACK",
      status: pass(factors.calculationEngineStability >= 55, true),
    },
  ];

  if (overrides) {
    return items.map((it) =>
      overrides[it.id] ? { ...it, status: overrides[it.id] as GateCheckStatus } : it,
    );
  }
  return items;
}

// ───────────────────────── public API ─────────────────────────

export function computeVersionIteration(
  input: VersionIterationInput = {},
): VersionReadinessResult {
  const factors = mergeScores(input.factors);
  const beta = input.betaResult ?? computeBetaLaunch();

  // Cross-engine constraints (read from Beta Launch / Feedback / Real Subject).
  const betaBlocksV1 =
    beta.recommendedStatus === "NOT_READY" || beta.recommendedStatus === "INTERNAL_ONLY";

  const positiveIndex = weightedAvg(
    {
      coreLoopCompleteness: factors.coreLoopCompleteness,
      userJourneyCompletion: factors.userJourneyCompletion,
      calculationEngineStability: factors.calculationEngineStability,
      feedbackLearningReadiness: factors.feedbackLearningReadiness,
      privacySafety: factors.privacySafety,
      documentationCompleteness: factors.documentationCompleteness,
      betaLaunchReadiness: factors.betaLaunchReadiness,
      regionalUXFit: factors.regionalUXFit,
      productCoherence: factors.productCoherence,
    },
    POSITIVE_WEIGHTS,
  );

  const negativeIndex = weightedAvg(
    {
      featureFragmentation: factors.featureFragmentation,
      cognitiveOverload: factors.cognitiveOverload,
      misuseRisk: factors.misuseRisk,
      unverifiedClaims: factors.unverifiedClaims,
    },
    NEGATIVE_WEIGHTS,
  );

  // Composite (mirrors Beta Launch shape — positive damped by friction).
  const friction = negativeIndex / 100;
  let raw = positiveIndex * (1 - 0.4 * friction);
  // Beta high risk damps further.
  if (beta.publicLaunchBlocked) raw *= 0.92;
  // Beta low readiness also damps.
  if (betaBlocksV1) raw = Math.min(raw, 58);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const status = statusFromScore(score, betaBlocksV1);
  const canMarkAsV1 =
    (status === "V1_PRIVATE_BETA" ||
      status === "V1_GUIDED_BETA" ||
      status === "WAITLIST_ONLY") &&
    !betaBlocksV1;

  const gateChecklist = evaluateGates(factors, beta, input.gateOverrides);
  const hasFailGate = gateChecklist.some((g) => g.status === "FAIL");
  const finalCanMarkAsV1 = canMarkAsV1 && !hasFailGate;
  const finalStatus: VersionReleaseStatus = finalCanMarkAsV1
    ? status
    : status === "V1_PRIVATE_BETA" || status === "V1_GUIDED_BETA" || status === "WAITLIST_ONLY"
    ? "V0_9_RC"
    : status;

  // Module partitioning
  const partition = (lvl: ModuleStabilityLevel) =>
    MODULE_STABILITY_REGISTRY.filter((m) => m.level === lvl).map((m) => `${m.cn} · ${m.en}`);

  const releaseBlockers: string[] = [];
  if (betaBlocksV1) {
    releaseBlockers.push(
      `Beta Launch 状态为 ${beta.recommendedStatus}，未达 Private Alpha — 阻断 v1.0。`,
    );
  }
  if (beta.publicLaunchBlocked) {
    releaseBlockers.push("Beta 风险门检测到高危风险，阻断公开发布。");
  }
  gateChecklist
    .filter((g) => g.status === "FAIL")
    .forEach((g) => releaseBlockers.push(`Release Gate 未通过：${g.cn}`));

  const requiredFixesBeforeV1: string[] = [];
  if (factors.feedbackLearningReadiness < 55) {
    requiredFixesBeforeV1.push("补齐回验中心入口与权重学习展示。");
  }
  if (factors.documentationCompleteness < 65) {
    requiredFixesBeforeV1.push("补齐使用手册与安全边界文档。");
  }
  if (factors.privacySafety < 70) {
    requiredFixesBeforeV1.push("加强 Full 60 与 Demo 数据隔离、补齐删除入口。");
  }
  if (factors.userJourneyCompletion < 55) {
    requiredFixesBeforeV1.push("打通主入口 → Demo → 触发日历 → 回验的完整路径。");
  }
  if (factors.unverifiedClaims > 55) {
    requiredFixesBeforeV1.push("清理未经回验支持的强断式文案。");
  }

  const notes: string[] = [];
  if (betaBlocksV1) {
    notes.push("当前 Beta Launch 状态不足以支撑 v1.0 标记，建议先补齐内测准备。");
  }
  if (factors.cognitiveOverload > 65) {
    notes.push("认知过载偏高 —— 建议简化首页与术语提示。");
  }
  if (factors.regionalUXFit < 55) {
    notes.push("地区体验适配偏弱 —— 建议针对目标地区优化文案与入口。");
  }

  return {
    versionReadinessScore: score,
    positiveIndex: Math.round(positiveIndex),
    negativeIndex: Math.round(negativeIndex),
    recommendedVersion: recommendedVersionFor(finalStatus),
    canMarkAsV1: finalCanMarkAsV1,
    releaseStatus: finalStatus,
    stableModules: partition("STABLE"),
    betaModules: partition("BETA"),
    experimentalModules: partition("EXPERIMENTAL"),
    placeholderModules: partition("PLACEHOLDER"),
    lockedModules: partition("LOCKED"),
    releaseBlockers,
    requiredFixesBeforeV1,
    recommendedBetaScope: recommendedBetaScopeFor(finalStatus),
    postV1Roadmap: postV1RoadmapFor(finalStatus),
    gateChecklist,
    betaSnapshot: {
      status: beta.recommendedStatus,
      score: beta.betaReadinessScore,
      publicLaunchBlocked: beta.publicLaunchBlocked,
    },
    notes,
  };
}

export const GATE_GROUP_META: Record<
  GateCheckItem["group"],
  { cn: string; en: string }
> = {
  CORE_LOOP: { cn: "核心闭环", en: "Core Loop" },
  SAFETY: { cn: "安全边界", en: "Safety" },
  DOCS: { cn: "产品文档", en: "Documentation" },
  BETA: { cn: "内测准备", en: "Beta Readiness" },
  UX: { cn: "用户体验", en: "UX" },
  FEEDBACK: { cn: "回验系统", en: "Feedback" },
};

export const GATE_STATUS_META: Record<
  GateCheckStatus,
  { cn: string; tone: string }
> = {
  PASS: { cn: "通过", tone: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" },
  WARNING: { cn: "警告", tone: "text-amber-300 border-amber-500/30 bg-amber-500/10" },
  FAIL: { cn: "未通过", tone: "text-rose-300 border-rose-500/30 bg-rose-500/10" },
  NOT_APPLICABLE: { cn: "不适用", tone: "text-muted-foreground border-border bg-muted/10" },
};
