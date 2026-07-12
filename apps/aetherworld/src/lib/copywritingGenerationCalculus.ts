// 文案生成计算法 Copywriting Generation Calculus
import { getCopyTarget } from "@/constants/copywritingTargets";
import { pickStylesForTarget, COPYWRITING_STYLES } from "@/constants/copywritingStyles";
import { getChannel } from "@/constants/copywritingChannels";
import { scanCopySafety } from "@/constants/copySafetyRules";
import { generateVariants, type CopyVariant } from "./copyVariantGenerator";
import { adaptForPlatform } from "./platformCopyAdapter";

export interface CopyGenerationInput {
  target: string;
  targetUser: string;
  channel: string;
  languageLevel: string;
  tone?: string;
  purpose?: string;
  sourceConcepts: string[];
  safetyLevel: "LOW" | "MEDIUM" | "HIGH";
  desiredLength: "MICRO" | "SHORT" | "MEDIUM" | "LONG";
  includeCTA: boolean;
}

export interface CopyGenerationResult {
  variants: CopyVariant[];
  recommendedVariantId: string;
  jargonRisk: number;
  safetyWarnings: string[];
  platformFitScore: number;
  suggestedTags?: string[];
  suggestedCTA?: string;
}

export function generateCopy(input: CopyGenerationInput): CopyGenerationResult {
  const target = getCopyTarget(input.target);
  const channel = getChannel(input.channel);
  const styleIds = pickStylesForTarget(input.target);

  // 生成 3 个版本
  let variants = styleIds.slice(0, 3).map(sid => {
    const style = COPYWRITING_STYLES.find(s => s.id === sid)!;
    return generateVariants({ input, style, target });
  });

  // 平台适配
  variants = variants.map(v => adaptForPlatform(v, input.channel));

  // 安全扫描
  const safetyHits = variants.flatMap(v => scanCopySafety(v.body, {
    needsSafetyNote: target?.requiresSafetyNote,
  }).hits);
  const safetyWarnings = safetyHits.map(
    h => `[${h.rule.severity}] ${h.rule.description}（命中：${h.matched}） → ${h.rule.suggestion}`,
  );

  // 选择推荐版本（无严重安全命中、且与目标语言层匹配）
  const recommended = variants.find(v => {
    const s = scanCopySafety(v.body);
    return s.ok;
  }) ?? variants[0];

  const jargonRisk = computeJargon(recommended.body);
  const platformFitScore = computePlatformFit(recommended, channel);

  return {
    variants,
    recommendedVariantId: recommended.id,
    jargonRisk,
    safetyWarnings,
    platformFitScore,
    suggestedTags: input.channel === "XIAOHONGSHU"
      ? ["#个人世界", "#信号系统", "#不算命", "#结构化判断"] : undefined,
    suggestedCTA: input.includeCTA ? defaultCTA(input.target) : undefined,
  };
}

function computeJargon(text: string): number {
  const jargons = ["风域奇点", "终端收束", "母体数列", "回验权重", "定数", "Full 60", "Demo Persona"];
  let hits = 0;
  for (const j of jargons) if (text.includes(j)) hits++;
  return Math.min(100, hits * 18);
}

function computePlatformFit(v: CopyVariant, channel?: { recommendedLength: string; forbiddenWords: string[] }): number {
  if (!channel) return 70;
  let score = 80;
  const len = v.body.length;
  const sweet: Record<string, [number, number]> = {
    MICRO: [10, 80], SHORT: [50, 200], MEDIUM: [150, 600], LONG: [400, 2000],
  };
  const [min, max] = sweet[channel.recommendedLength] ?? [80, 600];
  if (len < min) score -= 15;
  if (len > max) score -= 10;
  for (const w of channel.forbiddenWords) if (v.body.includes(w)) score -= 20;
  return Math.max(0, Math.min(100, score));
}

function defaultCTA(targetId: string): string {
  switch (targetId) {
    case "HOMEPAGE_HERO": return "开始你的第一次结构化判断";
    case "BEGINNER_ONBOARDING": return "用 3 分钟生成你的轻量个人模型";
    case "XIAOHONGSHU_POST": return "评论区聊聊你的「定没定」时刻";
    case "ENTERPRISE_SAFE_COPY": return "预约一次决策系统演示";
    case "WORLD_REPORT_COPY": return "保存这份世界报告";
    default: return "继续";
  }
}
