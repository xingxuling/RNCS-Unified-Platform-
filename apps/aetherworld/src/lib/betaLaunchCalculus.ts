// Beta Launch Calculus — judges whether the system is ready for closed testing,
// which segment to invite, which features to gate, and which risks to mitigate.

import {
  DEFAULT_BETA_FACTOR_SCORES,
  type BetaFactorScores,
  type BetaPositiveFactorKey,
  type BetaNegativeFactorKey,
} from "@/constants/betaLaunchFactors";
import {
  BETA_USER_SEGMENTS,
  BETA_USER_SEGMENT_LIST,
  type BetaUserSegmentId,
} from "@/constants/betaUserSegments";
import {
  BETA_ACCESS_LEVELS,
  type BetaAccessLevelId,
} from "@/constants/betaAccessLevels";
import {
  BETA_RISK_TYPES,
  type BetaRiskTypeId,
  type RiskLevel,
} from "@/constants/betaRiskTypes";

export type BetaLaunchStatus =
  | "NOT_READY"
  | "INTERNAL_ONLY"
  | "PRIVATE_ALPHA"
  | "CLOSED_BETA"
  | "GUIDED_BETA"
  | "PUBLIC_WAITLIST"
  | "RELEASE_CANDIDATE";

export const BETA_STATUS_META: Record<
  BetaLaunchStatus,
  { cn: string; en: string; desc: string }
> = {
  NOT_READY: { cn: "未准备好", en: "Not Ready", desc: "暂不适合开放任何真实用户。" },
  INTERNAL_ONLY: { cn: "仅内部测试", en: "Internal Only", desc: "仅创始人或核心团队自测。" },
  PRIVATE_ALPHA: { cn: "私密 Alpha", en: "Private Alpha", desc: "3–10 名高度信任用户。" },
  CLOSED_BETA: { cn: "封闭内测", en: "Closed Beta", desc: "10–50 名筛选用户。" },
  GUIDED_BETA: { cn: "引导式内测", en: "Guided Beta", desc: "50–200 名用户，需强 onboarding。" },
  PUBLIC_WAITLIST: { cn: "公开候补", en: "Public Waitlist", desc: "开放等待名单，不开放完整功能。" },
  RELEASE_CANDIDATE: { cn: "发布候选", en: "Release Candidate", desc: "准备公开发布，仍保留安全提示。" },
};

export interface BetaRiskEvaluation {
  id: BetaRiskTypeId;
  level: RiskLevel;
  cn: string;
  en: string;
  whyItMatters: string;
  mitigation: string;
  blocksPublicLaunch: boolean;
}

export interface BetaFeatureGateGroup {
  id:
    | "ALWAYS_OPEN"
    | "ALPHA_ONLY"
    | "TRUSTED_ONLY"
    | "RESEARCH_ONLY"
    | "RESTRICTED";
  label: string;
  features: string[];
}

export interface BetaLaunchResult {
  betaReadinessScore: number;
  positiveIndex: number;
  negativeIndex: number;
  recommendedStatus: BetaLaunchStatus;
  recommendedUserSegments: BetaUserSegmentId[];
  recommendedAccessLevels: BetaAccessLevelId[];
  lockedFeatures: string[];
  openFeatures: string[];
  guardedFeatures: string[];
  featureGates: BetaFeatureGateGroup[];
  requiredWarnings: string[];
  onboardingRequirements: string[];
  feedbackPlan: string[];
  launchRisks: BetaRiskEvaluation[];
  pauseConditions: string[];
  nextMilestone: string;
  publicLaunchBlocked: boolean;
  notes: string[];
}

export interface BetaLaunchInput {
  factors?: Partial<BetaFactorScores>;
  riskOverrides?: Partial<Record<BetaRiskTypeId, RiskLevel>>;
  targetRegion?: string; // e.g. "HK", "CN", "JP", "US", "GLOBAL"
}

// ───────────────────────────── core scoring ─────────────────────────────

const POSITIVE_WEIGHTS: Record<BetaPositiveFactorKey, number> = {
  productMaturity: 1.0,
  feedbackLoopStrength: 1.0,
  userComprehension: 1.0,
  privacySafety: 1.1,
  determinationReliability: 1.0,
  regionalUXFit: 0.8,
  documentationCompleteness: 0.9,
  operationalCapacity: 0.8,
  realSubjectSafety: 1.1,
};

const NEGATIVE_WEIGHTS: Record<BetaNegativeFactorKey, number> = {
  explanationCost: 0.9,
  misuseRisk: 1.1,
  overLaunchRisk: 1.0,
  cognitiveOverload: 0.9,
};

function mergeScores(input?: Partial<BetaFactorScores>): BetaFactorScores {
  return { ...DEFAULT_BETA_FACTOR_SCORES, ...(input ?? {}) };
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

function statusFromScore(score: number): BetaLaunchStatus {
  if (score < 30) return "NOT_READY";
  if (score < 45) return "INTERNAL_ONLY";
  if (score < 60) return "PRIVATE_ALPHA";
  if (score < 75) return "CLOSED_BETA";
  if (score < 85) return "GUIDED_BETA";
  if (score < 93) return "PUBLIC_WAITLIST";
  return "RELEASE_CANDIDATE";
}

function recommendedSegmentsFor(status: BetaLaunchStatus): BetaUserSegmentId[] {
  switch (status) {
    case "NOT_READY":
      return [];
    case "INTERNAL_ONLY":
      return ["FOUNDER_SELF"];
    case "PRIVATE_ALPHA":
      return ["FOUNDER_SELF", "TRUSTED_EXPERT", "RESEARCH"];
    case "CLOSED_BETA":
      return ["FOUNDER_SELF", "TRUSTED_EXPERT", "RESEARCH", "CREATOR", "PROFESSIONAL_DECISION"];
    case "GUIDED_BETA":
      return [
        "TRUSTED_EXPERT",
        "RESEARCH",
        "CREATOR",
        "PROFESSIONAL_DECISION",
        "REFLECTIVE_PERSONAL",
        "ENTERPRISE_ADJACENT",
      ];
    case "PUBLIC_WAITLIST":
      return BETA_USER_SEGMENT_LIST.map((s) => s.id);
    case "RELEASE_CANDIDATE":
      return BETA_USER_SEGMENT_LIST.map((s) => s.id);
  }
}

function recommendedAccessFor(status: BetaLaunchStatus): BetaAccessLevelId[] {
  switch (status) {
    case "NOT_READY":
    case "INTERNAL_ONLY":
      return ["L0_DEMO", "L1_LIGHT20", "L2_FULL60", "L3_FEEDBACK", "L4_PROMPT", "L5_ADVANCED", "L6_RESEARCH"];
    case "PRIVATE_ALPHA":
      return ["L0_DEMO", "L1_LIGHT20", "L2_FULL60", "L6_RESEARCH"];
    case "CLOSED_BETA":
      return ["L0_DEMO", "L1_LIGHT20", "L2_FULL60", "L3_FEEDBACK", "L4_PROMPT", "L6_RESEARCH"];
    case "GUIDED_BETA":
      return ["L0_DEMO", "L1_LIGHT20", "L3_FEEDBACK", "L4_PROMPT", "L6_RESEARCH", "L7_ENTERPRISE"];
    case "PUBLIC_WAITLIST":
      return ["L0_DEMO", "L6_RESEARCH", "L7_ENTERPRISE"];
    case "RELEASE_CANDIDATE":
      return Object.keys(BETA_ACCESS_LEVELS) as BetaAccessLevelId[];
  }
}

function buildFeatureGates(status: BetaLaunchStatus): BetaFeatureGateGroup[] {
  const trustedUnlocked: boolean = ["CLOSED_BETA", "GUIDED_BETA", "PUBLIC_WAITLIST", "RELEASE_CANDIDATE", "PRIVATE_ALPHA"].includes(
    status,
  );
  return [
    {
      id: "ALWAYS_OPEN",
      label: "始终开放",
      features: ["Demo Persona", "产品总览", "安全边界", "常数库基础说明"],
    },
    {
      id: "ALPHA_ONLY",
      label: "Alpha 起开放",
      features: ["Light 20 主体", "触发日历", "基础回验", "今日定数"],
    },
    {
      id: "TRUSTED_ONLY",
      label: trustedUnlocked ? "可信用户已开放" : "可信用户开放（当前未达条件）",
      features: ["Full 60 真实主体", "回验权重学习", "多计算法内核详情", "Prompt Forge", "地区用户体验计算"],
    },
    {
      id: "RESEARCH_ONLY",
      label: "研究用户开放",
      features: ["白皮书", "计算法文档", "回验协议", "导出测试报告"],
    },
    {
      id: "RESTRICTED",
      label: "始终锁定",
      features: ["高风险强断文案", "绝对未来表达", "医疗 / 金融 / 法律具体建议", "公开展示真实主体数列"],
    },
  ];
}

function buildOnboarding(status: BetaLaunchStatus): string[] {
  return [
    "Step 1：声明系统为结构化预测 OS，而非绝对预测。",
    "Step 2：选择主体模式（Demo / Light 20 / Full 60 / Research）。",
    "Step 3：说明 Full 60 数据仅本地保存，可随时删除。",
    "Step 4：选择目标域（Career / Relationship / Product / Health Recovery / Study / Creation / General）。",
    "Step 5：第一安全行动 —— 先看 Demo、生成 30 天触发日历、做一次小回验，不要立即做重大决策。",
    "Step 6：回验契约 —— 系统价值来自回验，不回验则模型不会真正进化。",
    status === "GUIDED_BETA" || status === "PUBLIC_WAITLIST"
      ? "Step 7：分流到地区化文案（Regional UX）。"
      : "Step 7：建议先邀请 1–2 位可信用户陪同体验。",
  ];
}

function buildFeedbackPlan(): string[] {
  return [
    "UX Feedback：术语 / 流程 / 信息密度是否可读。",
    "Prediction Feedback：预测是否有用、是否过强、是否过模糊。",
    "Loop Feedback：用户是否愿意回验，回验流程是否太长。",
    "Safety Feedback：是否出现绝对化误读或情绪依赖。",
    "记录字段：comprehensionScore / trustScore / overwhelmScore / usefulnessScore / safetyConcern。",
  ];
}

function buildWarnings(status: BetaLaunchStatus): string[] {
  const base = [
    "当前系统处于内测阶段，所有预测仅作结构判断与时间窗口判断。",
    "不构成医疗、法律、金融、投资、心理诊断建议。",
    "真实主体 60 组数列属于敏感个人数据，默认本地保存。",
    "请勿将预测作为重大决策的唯一依据。",
  ];
  if (status === "GUIDED_BETA" || status === "PUBLIC_WAITLIST") {
    base.push("公开化语言需严格使用「结构预测 / 时间窗口 / 行动许可」等表达，避免命运化断言。");
  }
  return base;
}

function buildPauseConditions(): string[] {
  return [
    "出现任意高危隐私事件（真实主体数据泄露 / 被公开）。",
    "出现高危误用事件（用户依据预测做出重大金融或医疗决策）。",
    "回验提交率持续 < 10%，模型无法校准。",
    "用户理解度评分 < 40，说明 onboarding 失败。",
    "Demo 与真实主体出现数据污染。",
    "客服 / 运营无法跟上反馈处理速度。",
  ];
}

function nextMilestoneFor(status: BetaLaunchStatus): string {
  switch (status) {
    case "NOT_READY":
      return "完成 Founder Self-Test 与基础文档补全后重新评估。";
    case "INTERNAL_ONLY":
      return "完成 60 组数列回验 ≥ 5 条、隐私边界文档补齐后，进入 Private Alpha。";
    case "PRIVATE_ALPHA":
      return "邀请 3–10 名可信用户测试 14 天，目标术语理解度 ≥ 60，安全误解率 ≤ 20%。";
    case "CLOSED_BETA":
      return "扩展到 10–50 名筛选用户 30 天，回验提交率 ≥ 30%，Demo 完成率 ≥ 70%。";
    case "GUIDED_BETA":
      return "扩展到 50–200 名用户，目标 7 日回访率 ≥ 20%，文档访问率 ≥ 35%。";
    case "PUBLIC_WAITLIST":
      return "开放等待名单，仅向通过筛选的用户分批发放 Full 60 权限。";
    case "RELEASE_CANDIDATE":
      return "准备正式发布，保留安全提示与回验闭环；持续监控误用与情绪依赖事件。";
  }
}

function evaluateRisks(
  factors: BetaFactorScores,
  overrides?: Partial<Record<BetaRiskTypeId, RiskLevel>>,
): BetaRiskEvaluation[] {
  const computed: Record<BetaRiskTypeId, RiskLevel> = {} as never;

  const level = (n: number, hi: number, mid: number): RiskLevel =>
    n >= hi ? "HIGH" : n >= mid ? "MEDIUM" : "LOW";

  computed.PRIVACY_LEAK = level(100 - factors.privacySafety, 60, 30);
  computed.OVER_DETERMINISM = level(factors.misuseRisk, 70, 40);
  computed.MISINTERPRETATION = level(100 - factors.userComprehension, 60, 35);
  computed.COGNITIVE_OVERLOAD = level(factors.cognitiveOverload, 70, 45);
  computed.EMOTIONAL_DEPENDENCE = level(factors.misuseRisk, 75, 45);
  computed.FINANCIAL_MISUSE = level(factors.misuseRisk, 80, 55);
  computed.MEDICAL_MISUSE = level(factors.misuseRisk, 80, 55);
  computed.ENTERPRISE_MISPOSITIONING = level(100 - factors.regionalUXFit, 65, 40);
  computed.CULTURAL_MISREAD = level(100 - factors.regionalUXFit, 60, 35);
  computed.DATA_POLLUTION = level(100 - factors.realSubjectSafety, 60, 30);

  return (Object.keys(BETA_RISK_TYPES) as BetaRiskTypeId[]).map((id) => {
    const meta = BETA_RISK_TYPES[id];
    const lvl = overrides?.[id] ?? computed[id] ?? meta.defaultLevel;
    return {
      id,
      level: lvl,
      cn: meta.cn,
      en: meta.en,
      whyItMatters: meta.whyItMatters,
      mitigation: meta.mitigation,
      blocksPublicLaunch: meta.blocksPublicLaunchWhenHigh && lvl === "HIGH",
    };
  });
}

// ───────────────────────────── public API ─────────────────────────────

export function computeBetaLaunch(input: BetaLaunchInput = {}): BetaLaunchResult {
  const factors = mergeScores(input.factors);

  const positiveIndex = weightedAvg(
    {
      productMaturity: factors.productMaturity,
      feedbackLoopStrength: factors.feedbackLoopStrength,
      userComprehension: factors.userComprehension,
      privacySafety: factors.privacySafety,
      determinationReliability: factors.determinationReliability,
      regionalUXFit: factors.regionalUXFit,
      documentationCompleteness: factors.documentationCompleteness,
      operationalCapacity: factors.operationalCapacity,
      realSubjectSafety: factors.realSubjectSafety,
    },
    POSITIVE_WEIGHTS,
  );

  const negativeIndex = weightedAvg(
    {
      explanationCost: factors.explanationCost,
      misuseRisk: factors.misuseRisk,
      overLaunchRisk: factors.overLaunchRisk,
      cognitiveOverload: factors.cognitiveOverload,
    },
    NEGATIVE_WEIGHTS,
  );

  // Composite: positive index dampened by the negative index.
  const friction = negativeIndex / 100; // 0..1
  const raw = positiveIndex * (1 - 0.45 * friction);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const status = statusFromScore(score);
  const segments = recommendedSegmentsFor(status);
  const access = recommendedAccessFor(status);
  const gates = buildFeatureGates(status);
  const risks = evaluateRisks(factors, input.riskOverrides);
  const publicLaunchBlocked = risks.some((r) => r.blocksPublicLaunch);

  const openFeatures = gates
    .filter((g) => g.id === "ALWAYS_OPEN" || g.id === "ALPHA_ONLY" || g.id === "RESEARCH_ONLY")
    .flatMap((g) => g.features);
  const guardedFeatures = gates.find((g) => g.id === "TRUSTED_ONLY")?.features ?? [];
  const lockedFeatures = gates.find((g) => g.id === "RESTRICTED")?.features ?? [];

  const notes: string[] = [];
  if (publicLaunchBlocked) {
    notes.push("存在高危风险，禁止进入公开发布；当前仅允许内测分发。");
  }
  if (factors.feedbackLoopStrength < 50) {
    notes.push("回验闭环偏弱，建议优先补齐回验入口与权重显示。");
  }
  if (factors.userComprehension < 50) {
    notes.push("用户理解度偏低，建议加强首页与 onboarding 的结构化说明。");
  }
  if (input.targetRegion) {
    notes.push(`目标地区：${input.targetRegion} —— 请同步检查 Regional UX Fit 与禁用词表。`);
  }

  return {
    betaReadinessScore: score,
    positiveIndex: Math.round(positiveIndex),
    negativeIndex: Math.round(negativeIndex),
    recommendedStatus: status,
    recommendedUserSegments: segments,
    recommendedAccessLevels: access,
    lockedFeatures,
    openFeatures,
    guardedFeatures,
    featureGates: gates,
    requiredWarnings: buildWarnings(status),
    onboardingRequirements: buildOnboarding(status),
    feedbackPlan: buildFeedbackPlan(),
    launchRisks: risks,
    pauseConditions: buildPauseConditions(),
    nextMilestone: nextMilestoneFor(status),
    publicLaunchBlocked,
    notes,
  };
}

// ───────────────────────────── invite copy ─────────────────────────────

export type BetaInviteCopyType =
  | "trusted_expert"
  | "creator"
  | "research"
  | "personal_reflection"
  | "enterprise_safe"
  | "founder";

export interface BetaInviteCopy {
  type: BetaInviteCopyType;
  title: string;
  body: string;
}

export function generateInviteCopy(
  segmentId: BetaUserSegmentId,
  status: BetaLaunchStatus,
): BetaInviteCopy {
  const segment = BETA_USER_SEGMENTS[segmentId];
  const statusCn = BETA_STATUS_META[status].cn;
  const TYPE_TITLES: Record<BetaInviteCopyType, string> = {
    trusted_expert: "邀请你参与 Aether Fate Engine 私密内测",
    creator: "邀请创作者测试 Aether 的提示词锻造与发布窗口",
    research: "邀请研究者评估 Aether 的结构化预测协议",
    personal_reflection: "邀请你以自我探索方式体验 Aether",
    enterprise_safe: "邀请企业用户体验 Aether Decision Timing 模式",
    founder: "Founder Self-Test：完整跑通 Aether 内核",
  };

  const COMMON_TAIL =
    "本系统为结构化预测 OS，不构成绝对预测，不替代医疗、法律、金融、心理建议。真实主体数据仅本地保存。";

  let body = "";
  switch (segment.inviteCopyType) {
    case "trusted_expert":
      body = `当前处于 ${statusCn} 阶段。希望邀请你参与小范围测试，重点关注：结构判断是否清晰、时间窗口是否可用、定数判断是否被你理解为「未定/半定/已定」而非绝对断言。${COMMON_TAIL}`;
      break;
    case "creator":
      body = `Aether 提供：发布窗口判断、产品活性曲线、提示词锻造炉。希望你用一次真实的产品发布来验证它。${COMMON_TAIL}`;
      break;
    case "research":
      body = `Aether 当前包含多计算法内核、定数计算法、回验权重引擎与白皮书文档。欢迎研究型用户阅读方法论并提交回验数据。${COMMON_TAIL}`;
      break;
    case "personal_reflection":
      body = `Aether 提供 30 天触发日历、关系/事业/身体窗口与回验机制。请以自我探索为主，不要把任一日窗口当作绝对指令。${COMMON_TAIL}`;
      break;
    case "enterprise_safe":
      body = `企业模式下，系统隐藏命运化语言，仅提供 Decision Timing、Scenario Trigger 与 Risk Window。所有输出可被视为结构化决策辅助。${COMMON_TAIL}`;
      break;
    case "founder":
      body = `进入 Founder Self-Test：输入完整 60 组数列，跑通三循环 → 五域 → 终端模式 → 定数判断 → 回验权重的闭环。${COMMON_TAIL}`;
      break;
  }
  return { type: segment.inviteCopyType, title: TYPE_TITLES[segment.inviteCopyType], body };
}
