// Product-User Language Translation Engine
// 产品与用户语言计算引擎
import {
  PRODUCT_TERMINOLOGY_MAP,
  type TerminologyEntry,
  findTerm,
} from "@/constants/productTerminologyMap";
import {
  USER_TYPE_DEFAULT_LEVEL,
  type UserLanguageLevel,
} from "@/constants/userLanguageLevels";
import {
  JARGON_DENSITY_THRESHOLDS,
  PAGE_TYPE_JARGON_LIMIT,
  type JargonRisk,
} from "@/constants/jargonRiskLevels";
import {
  DEFAULT_PLAIN_REWRITE_MAP,
  ENTERPRISE_FORBIDDEN_TERMS,
} from "@/constants/languageRewriteRules";

export type ClientType =
  | "demo_visitor" | "light_user" | "full_subject" | "creator_user"
  | "research_user" | "enterprise_user" | "admin_user" | "founder_user";

export type PageType = "user_main" | "mobile" | "enterprise" | "demo" | "docs" | "advanced";

export interface LanguageFitInput {
  userType: ClientType;
  region?: string;
  productStage?: string;       // INTERNAL / CLOSED_BETA / PUBLIC
  pageType: PageType;
  pageText: string;
  userFamiliarity?: number;    // 0-100
  actionUrgency?: number;      // 0-100
  trustRequirement?: number;   // 0-100
  cognitiveLoad?: number;      // 0-100 (估算)
}

export interface DetectedTerm {
  term: string;
  entry: TerminologyEntry;
  occurrences: number;
}

export interface LanguageFitResult {
  jargonDensity: number;               // 0-100
  jargonDensityBand: "EASY" | "ACCEPTABLE" | "HARD" | "HIGH" | "EXTREME";
  detectedTerms: DetectedTerm[];
  highRiskTerms: DetectedTerm[];
  recommendedLevel: UserLanguageLevel;
  fitScore: number;                    // 0-100
  needsRewrite: boolean;
  needsTooltip: boolean;
  enterpriseRisks: string[];
  fateMystificationRisks: string[];
  suggestions: string[];
}

// 扫描页面文本中出现的术语
export function detectTerms(text: string): DetectedTerm[] {
  const out: DetectedTerm[] = [];
  for (const entry of PRODUCT_TERMINOLOGY_MAP) {
    const re = new RegExp(escapeRegExp(entry.rawTerm), "g");
    const matches = text.match(re);
    if (matches && matches.length > 0) {
      out.push({ term: entry.rawTerm, entry, occurrences: matches.length });
    }
  }
  return out;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 计算术语密度
export function computeJargonDensity(
  detected: DetectedTerm[],
  text: string,
  recommendedLevel: UserLanguageLevel,
): number {
  if (!detected.length) return 0;
  const count = detected.reduce((s, d) => s + d.occurrences, 0);
  const avgDiff = detected.reduce((s, d) => s + d.entry.difficultyScore, 0) / detected.length;
  const lengthFactor = Math.max(1, Math.log2(Math.max(50, text.length)) / 10);
  const levelDivisor = (
    recommendedLevel === "RAW_SYSTEM"   ? 4 :
    recommendedLevel === "EDUCATIONAL"  ? 3 :
    recommendedLevel === "PROFESSIONAL" ? 2.2 :
    recommendedLevel === "USER_FRIENDLY"? 1.4 :
    recommendedLevel === "ACTION_ORIENTED" ? 1.3 :
    recommendedLevel === "ENTERPRISE_SAFE" ? 1.8 :
    /* MICROCOPY */ 1.0
  );
  const raw = (count * avgDiff * lengthFactor) / (levelDivisor * 12);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function densityBand(d: number): LanguageFitResult["jargonDensityBand"] {
  if (d <= JARGON_DENSITY_THRESHOLDS.EASY) return "EASY";
  if (d <= JARGON_DENSITY_THRESHOLDS.ACCEPTABLE) return "ACCEPTABLE";
  if (d <= JARGON_DENSITY_THRESHOLDS.HARD) return "HARD";
  if (d <= JARGON_DENSITY_THRESHOLDS.HIGH) return "HIGH";
  return "EXTREME";
}

// 推荐当前用户/页面的语言层级
export function recommendLevel(userType: ClientType, pageType: PageType): UserLanguageLevel {
  if (pageType === "enterprise" || userType === "enterprise_user") return "ENTERPRISE_SAFE";
  if (pageType === "mobile") return "MICROCOPY";
  if (pageType === "docs") return "EDUCATIONAL";
  if (pageType === "advanced") return "PROFESSIONAL";
  if (pageType === "demo" || userType === "demo_visitor") return "USER_FRIENDLY";
  const defaults = USER_TYPE_DEFAULT_LEVEL[userType] ?? ["USER_FRIENDLY"];
  return defaults[0] as UserLanguageLevel;
}

// 主入口：评估
export function evaluateLanguageFit(input: LanguageFitInput): LanguageFitResult {
  const detected = detectTerms(input.pageText);
  const recommendedLevel = recommendLevel(input.userType, input.pageType);
  const density = computeJargonDensity(detected, input.pageText, recommendedLevel);
  const band = densityBand(density);

  const highRiskTerms = detected.filter(
    (d) => d.entry.jargonRisk === "HIGH" || d.entry.jargonRisk === "EXTREME",
  );

  // 企业风险（命运化词）
  const enterpriseRisks: string[] = [];
  if (input.userType === "enterprise_user" || input.pageType === "enterprise") {
    for (const term of ENTERPRISE_FORBIDDEN_TERMS) {
      if (input.pageText.includes(term)) enterpriseRisks.push(term);
    }
    for (const d of detected) {
      if (d.entry.jargonRisk === "EXTREME") enterpriseRisks.push(d.term);
    }
  }

  // Demo 误导风险
  const fateMystificationRisks: string[] = [];
  if (input.pageType === "demo" || input.userType === "demo_visitor") {
    ["你的命运", "真实命运", "已注定", "必将发生"].forEach((t) => {
      if (input.pageText.includes(t)) fateMystificationRisks.push(t);
    });
  }

  const pageLimit = PAGE_TYPE_JARGON_LIMIT[input.pageType] ?? 60;
  const needsRewrite = density > pageLimit || enterpriseRisks.length > 0 || fateMystificationRisks.length > 0;
  const needsTooltip = highRiskTerms.length > 0 && recommendedLevel !== "RAW_SYSTEM";

  // Fit score
  const userType = input.userType;
  const userFamiliarity = clamp(input.userFamiliarity ?? defaultFamiliarity(userType), 0, 100);
  const trustReq = clamp(input.trustRequirement ?? 60, 0, 100);
  const cognitive = clamp(input.cognitiveLoad ?? estimateCognitive(density, detected.length), 0, 100);
  const misinterpretRisk = highRiskTerms.length * 10 + enterpriseRisks.length * 15 + fateMystificationRisks.length * 20;

  const positive = userFamiliarity * 0.4 + trustReq * 0.2 + (100 - density) * 0.4;
  const negative = density * 0.3 + cognitive * 0.3 + misinterpretRisk * 0.4;
  const fitScore = clamp(Math.round(positive - negative * 0.5), 0, 100);

  const suggestions: string[] = [];
  if (needsRewrite) suggestions.push(`术语密度 ${density} 超过 ${input.pageType} 上限 ${pageLimit}，建议替换为用户语言。`);
  if (input.pageType === "mobile" && density > 40) suggestions.push("移动端应优先使用 microcopy（短文案）。");
  if (enterpriseRisks.length) suggestions.push(`企业端检测到命运化术语：${enterpriseRisks.join("、")}。`);
  if (fateMystificationRisks.length) suggestions.push("Demo 模式不得让用户误以为是其真实命运。");
  if (needsTooltip) suggestions.push(`首次出现高阶术语（${highRiskTerms.map(t=>t.term).join("、")}）需附 tooltip。`);

  return {
    jargonDensity: density,
    jargonDensityBand: band,
    detectedTerms: detected,
    highRiskTerms,
    recommendedLevel,
    fitScore,
    needsRewrite,
    needsTooltip,
    enterpriseRisks,
    fateMystificationRisks,
    suggestions,
  };
}

// 单术语翻译
export function translateTerm(rawTerm: string, level: UserLanguageLevel): string {
  const e = findTerm(rawTerm);
  if (!e) return rawTerm;
  switch (level) {
    case "RAW_SYSTEM":      return e.rawTerm;
    case "PROFESSIONAL":    return e.professionalTerm;
    case "USER_FRIENDLY":   return e.userFriendlyTerm;
    case "ACTION_ORIENTED": return e.actionOrientedTerm;
    case "ENTERPRISE_SAFE": return e.enterpriseSafeTerm;
    case "EDUCATIONAL":     return `${e.rawTerm}（${e.educationalExplanation}）`;
    case "MICROCOPY":       return e.microcopy;
  }
}

// 整段文本翻译
export function translateText(text: string, level: UserLanguageLevel): string {
  let out = text;
  for (const e of PRODUCT_TERMINOLOGY_MAP) {
    const replacement = translateTerm(e.rawTerm, level);
    if (replacement && replacement !== e.rawTerm) {
      out = out.split(e.rawTerm).join(replacement);
    }
  }
  return out;
}

// 默认普通降级
export function plainRewrite(text: string): string {
  let out = text;
  for (const [k, v] of Object.entries(DEFAULT_PLAIN_REWRITE_MAP)) {
    out = out.split(k).join(v);
  }
  return out;
}

// Prompt Forge 接入参数
export interface LanguagePromptDirectives {
  targetUserLanguageLevel: UserLanguageLevel;
  forbiddenJargon: string[];
  requiredPlainLanguage: string[];
  enterpriseSafeTerms: string[];
  microcopyMode: boolean;
  explanationDepth: "NONE" | "TOOLTIP" | "INLINE" | "FULL";
  terminologyHints: { raw: string; useInstead: string }[];
}

export function buildPromptDirectives(input: LanguageFitInput): LanguagePromptDirectives {
  const level = recommendLevel(input.userType, input.pageType);
  const isEnterprise = input.userType === "enterprise_user" || input.pageType === "enterprise";
  const isMobile = input.pageType === "mobile";
  const forbidden: string[] = [];
  const required: string[] = [];
  const enterpriseSafe: string[] = [];
  const hints: { raw: string; useInstead: string }[] = [];

  for (const e of PRODUCT_TERMINOLOGY_MAP) {
    if (isEnterprise) {
      enterpriseSafe.push(e.enterpriseSafeTerm);
      if (e.jargonRisk === "EXTREME" || e.jargonRisk === "HIGH") forbidden.push(e.rawTerm);
      hints.push({ raw: e.rawTerm, useInstead: e.enterpriseSafeTerm });
    } else if (level === "USER_FRIENDLY" || level === "ACTION_ORIENTED") {
      if (e.jargonRisk === "EXTREME") forbidden.push(e.rawTerm);
      required.push(e.userFriendlyTerm);
      hints.push({ raw: e.rawTerm, useInstead: e.userFriendlyTerm });
    } else if (level === "MICROCOPY") {
      forbidden.push(e.rawTerm);
      required.push(e.microcopy);
      hints.push({ raw: e.rawTerm, useInstead: e.microcopy });
    }
  }
  if (isEnterprise) forbidden.push(...ENTERPRISE_FORBIDDEN_TERMS);

  return {
    targetUserLanguageLevel: level,
    forbiddenJargon: Array.from(new Set(forbidden)),
    requiredPlainLanguage: Array.from(new Set(required)).slice(0, 20),
    enterpriseSafeTerms: Array.from(new Set(enterpriseSafe)),
    microcopyMode: isMobile,
    explanationDepth:
      level === "EDUCATIONAL" ? "FULL" :
      level === "PROFESSIONAL" ? "INLINE" :
      level === "RAW_SYSTEM" ? "NONE" :
      "TOOLTIP",
    terminologyHints: hints.slice(0, 20),
  };
}

// Beta / Version 门槛
export function languageGatesForBeta(score: number, userType: ClientType) {
  if (userType === "demo_visitor" && score < 70)
    return { blocked: true, reason: "Demo 用户语言适配 < 70，不能开放公开 Demo。" };
  if (userType === "light_user" && score < 65)
    return { blocked: true, reason: "Light 用户语言适配 < 65，不能进入 Closed Beta。" };
  if (userType === "enterprise_user" && score < 85)
    return { blocked: true, reason: "企业模式语言适配 < 85，企业模式锁定。" };
  return { blocked: false, reason: "Language gate passed." };
}

export function languageGatesForVersion(score: number) {
  return score >= 70
    ? { blocked: false, reason: "Language fit OK." }
    : { blocked: true, reason: "核心用户路径语言适配不足，不能标记 Guided Beta。" };
}

// Utils
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
function defaultFamiliarity(t: ClientType) {
  return ({
    demo_visitor: 15, light_user: 35, full_subject: 70, creator_user: 80,
    research_user: 85, enterprise_user: 30, admin_user: 90, founder_user: 95,
  } as Record<ClientType, number>)[t] ?? 50;
}
function estimateCognitive(density: number, termCount: number) {
  return Math.min(100, Math.round(density * 0.7 + termCount * 3));
}
