// Regional User Experience Engine 地区用户体验计算引擎
import { REGION_PROFILES, getRegion, type RegionProfile } from "@/constants/regionProfiles";
import { UX_MODES, type UXModeKey } from "@/constants/userExperienceModes";
import { FORBIDDEN_TERMS, PREFERRED_TERMS, UNIVERSAL_DISCLAIMERS } from "@/constants/regionalCopywriting";
import { clamp } from "./math";

export interface RegionalUXResult {
  region: string;
  regionEn: string;
  uxFitScore: number;            // 0-100
  recommendedPositioning: string;
  primaryUserFear: string;
  primaryUserDesire: string;
  trustMechanism: string[];
  onboardingStrategy: string[];
  copywritingStyle: string;
  visualStyleAdjustment: string[];
  featurePriority: string[];
  monetizationFit: string;
  privacyRequirements: string[];
  riskWarnings: string[];
  localizationNotes: string[];
  finalUXRecommendation: string;
  // 派生
  mode: UXModeKey;
  forbiddenTerms: string[];
  preferredTerms: string[];
  copy: RegionProfile["copy"];
  breakdown: {
    label: string; value: number; weight: "pos" | "neg";
  }[];
}

// 公式：
// Regional UX Fit =
// (Region Const × Psychology × Cultural × Trust × Comprehension × Action × Payment × Risk)
// / (Cognitive Friction × Cultural Misread × Over-Mystification)
// → 归一到 0-100
export function calculateRegionalUX(regionKey: string, modeOverride?: UXModeKey): RegionalUXResult {
  const p = getRegion(regionKey);

  // 正向因子
  const psychology   = (p.productComprehensionLevel + p.aiAcceptance) / 2;
  const cultural     = clamp(100 - Math.abs(p.mysticalTolerance - 50), 0, 100); // 适中最优
  const trust        = (p.privacySensitivity + 100 - Math.abs(p.privacySensitivity - 80)) / 2;
  const comprehension= p.productComprehensionLevel;
  const action       = (p.aiAcceptance + p.productComprehensionLevel) / 2;
  const payment      = p.paymentReadiness;
  const risk         = p.privacySensitivity;
  const regionConst  = 70; // 基线

  // 负向因子（摩擦）
  const cognitiveFriction = clamp(100 - p.productComprehensionLevel, 5, 100);
  const culturalMisread   = clamp(Math.abs(p.mysticalTolerance - 50), 5, 100);
  const overMystification = clamp(p.mysticalTolerance > 70 ? p.mysticalTolerance - 50 : 20, 5, 100);

  const posAvg = (regionConst + psychology + cultural + trust + comprehension + action + payment + risk) / 8;
  const negAvg = (cognitiveFriction + culturalMisread + overMystification) / 3;
  const uxFitScore = Math.round(clamp(posAvg - negAvg * 0.45, 0, 100));

  const mode = modeOverride ?? p.defaultMode;

  return {
    region: p.regionName,
    regionEn: p.regionEn,
    uxFitScore,
    recommendedPositioning: derivePositioning(p),
    primaryUserFear: p.primaryUserFear,
    primaryUserDesire: p.primaryUserDesire,
    trustMechanism: deriveTrust(p),
    onboardingStrategy: deriveOnboarding(p),
    copywritingStyle: p.preferredTone,
    visualStyleAdjustment: deriveVisuals(p),
    featurePriority: p.featurePriority,
    monetizationFit: p.monetizationFit,
    privacyRequirements: derivePrivacy(p),
    riskWarnings: deriveWarnings(p),
    localizationNotes: deriveLocalization(p),
    finalUXRecommendation: deriveFinal(p, uxFitScore, mode),
    mode,
    forbiddenTerms: FORBIDDEN_TERMS[p.key] ?? [],
    preferredTerms: PREFERRED_TERMS[p.key] ?? [],
    copy: p.copy,
    breakdown: [
      { label: "Region Const", value: regionConst, weight: "pos" },
      { label: "Psychology", value: Math.round(psychology), weight: "pos" },
      { label: "Cultural Fit", value: Math.round(cultural), weight: "pos" },
      { label: "Trust Capacity", value: Math.round(trust), weight: "pos" },
      { label: "Comprehension", value: comprehension, weight: "pos" },
      { label: "Action Path", value: Math.round(action), weight: "pos" },
      { label: "Payment Readiness", value: payment, weight: "pos" },
      { label: "Risk Sensitivity", value: risk, weight: "pos" },
      { label: "Cognitive Friction", value: Math.round(cognitiveFriction), weight: "neg" },
      { label: "Cultural Misread", value: Math.round(culturalMisread), weight: "neg" },
      { label: "Over-Mystification", value: Math.round(overMystification), weight: "neg" },
    ],
  };
}

function derivePositioning(p: RegionProfile): string {
  return `${p.copy.heading} — ${p.copy.subheading}`;
}
function deriveTrust(p: RegionProfile): string[] {
  const base = ["专业文档", "Demo Persona 与真实主体隔离", "回验系统可见", "明确免责声明"];
  if (p.privacySensitivity >= 80) base.push("private-by-default / 本地存储声明");
  if (p.key === "enterprise" || p.key === "research") base.push("可审计性 / 方法论文档");
  if (p.key === "us") base.push("Terms of Service + Privacy Policy");
  return base;
}
function deriveOnboarding(p: RegionProfile): string[] {
  return [
    `Step 1 · ${p.key === "global" ? "Pick goal" : "选择使用场景"}`,
    `Step 2 · 选择地区语境（默认：${p.regionEn}）`,
    `Step 3 · ${p.preferredOnboarding}`,
    `Step 4 · 显示地区适配解释`,
    `Step 5 · 进入产品 · 入口：${p.bestEntryPoint}`,
  ];
}
function deriveVisuals(p: RegionProfile): string[] {
  const v: string[] = [];
  if (p.key === "hk" || p.key === "sg") v.push("克制、专业金融感", "高对比、双语 typography");
  if (p.key === "jp") v.push("静谧 / 留白 / 仪式感", "精致排版");
  if (p.key === "tw") v.push("温和 / 星图视觉 / 柔光", "圆润字体");
  if (p.key === "enterprise") v.push("企业 dashboard 化", "数据密度高、隐藏命理符号");
  if (p.key === "creator") v.push("工具感 / 快速节奏", "强 CTA");
  if (p.key === "cn") v.push("结构化卡片", "去玄学符号");
  if (p.key === "research") v.push("学术排版", "图表 / 表格优先");
  if (!v.length) v.push("保持深邃星图风格");
  return v;
}
function derivePrivacy(p: RegionProfile): string[] {
  const list = ["主体数据本地存储", "Demo 与真实主体严格隔离", "用户可导出 / 可清除"];
  if (p.key === "us") list.push("CCPA / 适用法律说明");
  if (p.key === "sg" || p.key === "hk") list.push("PDPA / GDPR-style 文案");
  if (p.key === "enterprise") list.push("团队权限 + 审计日志（路线图）");
  if (p.key === "cn") list.push("符合本地数据规范的边界说明");
  return list;
}
function deriveWarnings(p: RegionProfile): string[] {
  const base = [...UNIVERSAL_DISCLAIMERS];
  if (p.mysticalTolerance < 40) base.unshift("Not a fortune-telling product.");
  if (p.key === "cn") base.unshift("本系统不提供绝对预言，仅作趋势与决策辅助。");
  if (p.key === "enterprise") base.unshift("Decision-support tool only; outputs are not auditable predictions of future events.");
  return base;
}
function deriveLocalization(p: RegionProfile): string[] {
  return [
    `首选语言：${p.languagePreference.join(" / ")}`,
    `语气：${p.preferredTone}`,
    `禁词参考：${(FORBIDDEN_TERMS[p.key] ?? ["—"]).join("、") || "无"}`,
    `偏好词：${(PREFERRED_TERMS[p.key] ?? ["—"]).join("、")}`,
  ];
}
function deriveFinal(p: RegionProfile, score: number, mode: UXModeKey): string {
  const band =
    score >= 80 ? "高适配：可直接以默认策略进入此地区。" :
    score >= 60 ? "中等适配：建议按本页推荐调整文案 / 入口 / 风险表达。" :
                   "低适配：建议谨慎切入，先用 Demo-First 验证理解度。";
  return `${band} 建议默认模式：${UX_MODES[mode].cn}（${UX_MODES[mode].en}）。`;
}

// ============= Prompt 输出：地区化 Lovable 提示词 =============
export function buildRegionalPrompt(result: RegionalUXResult, productContext: string): string {
  const lines = [
    `# Regional UX Adaptation Prompt`,
    `Target Region: ${result.regionEn} (${result.region})`,
    `UX Mode: ${UX_MODES[result.mode].en} / ${UX_MODES[result.mode].cn}`,
    `UX Fit Score: ${result.uxFitScore}/100`,
    ``,
    `## Product Context`,
    productContext,
    ``,
    `## Positioning`,
    `- Heading: ${result.copy.heading}`,
    `- Subheading: ${result.copy.subheading}`,
    `- CTAs: ${result.copy.primaryCta} / ${result.copy.secondaryCta}`,
    ``,
    `## Copywriting Style`,
    `- Tone: ${result.copywritingStyle}`,
    `- Preferred terms: ${result.preferredTerms.join(", ") || "—"}`,
    `- Forbidden terms: ${result.forbiddenTerms.join(", ") || "—"}`,
    ``,
    `## Feature Priority (order matters)`,
    ...result.featurePriority.map((f, i) => `${i + 1}. ${f}`),
    ``,
    `## Trust Mechanism`,
    ...result.trustMechanism.map((t) => `- ${t}`),
    ``,
    `## Privacy & Risk`,
    ...result.privacyRequirements.map((p) => `- privacy: ${p}`),
    ...result.riskWarnings.map((r) => `- risk: ${r}`),
    ``,
    `## Visual Adjustments`,
    ...result.visualStyleAdjustment.map((v) => `- ${v}`),
    ``,
    `## Final Recommendation`,
    result.finalUXRecommendation,
  ];
  return lines.join("\n");
}

export { REGION_PROFILES, UX_MODES };
