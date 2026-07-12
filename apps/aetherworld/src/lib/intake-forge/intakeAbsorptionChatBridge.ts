// 投喂吸收率 · Chat Bridge
// 识别"为什么 token 还是很少 / 吸收率多少 / 长样本进数据集没"等问题，返回 IntakeAbsorptionCard。
import type { IntakeForgeRun } from "./intakeForgeTypes";
import type { IntakeAbsorptionCard } from "./intakeAbsorptionTypes";
import { buildAbsorptionCard } from "./intakeAbsorption";

const ABSORPTION_KEYWORDS = [
  "吸收率", "吸收", "raw token", "原始 token", "原始token",
  "token 还是很少", "token还是很少", "token 很少", "为什么 token",
  "长样本", "长语料", "长文本进数据集", "重新吸收",
  "Full Corpus", "full corpus", "混合吸收", "全量吸收",
  "平均 token", "样本 token", "可训练 token",
];

export function detectIntakeAbsorptionIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return ABSORPTION_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

/** 基于最近一次 run 生成吸收卡片；若没有 run 则给空壳解释 */
export function buildIntakeAbsorptionCard(
  question: string,
  lastRun: IntakeForgeRun | null | undefined,
): IntakeAbsorptionCard {
  if (lastRun?.absorption) {
    return buildAbsorptionCard(question, lastRun.absorption);
  }
  return {
    question,
    explanation:
      "尚未检测到最近的投喂记录。请先在 /system/intake-forge 用混合吸收模式投喂材料，系统会生成 RawCorpusDocument + LongCorpusChunk 并计算吸收率。" +
      "样本数高 ≠ token 多：只有 RawCorpusDocument 与 LongCorpusChunk 才计入真正可训练 token。",
    rawTokens: 0,
    absorbedTokens: 0,
    absorptionRate: 0,
    longCorpusTokens: 0,
    shortSampleTokens: 0,
    unabsorbedTokens: 0,
    avgShortSampleTokens: 0,
    mode: "HYBRID",
    modeLabel: "混合吸收模式",
    nextAction: "前往 /system/intake-forge，选择「混合吸收模式」后重新投喂。",
    warnings: [],
  };
}
