// 文案提示词编译器（用于交给 AI 进一步润色 / 批量生成）
import type { CopyGenerationInput } from "./copywritingGenerationCalculus";
import { getCopyTarget } from "@/constants/copywritingTargets";
import { getChannel } from "@/constants/copywritingChannels";

export function compileCopyPrompt(input: CopyGenerationInput, extraNotes?: string): string {
  const t = getCopyTarget(input.target);
  const ch = getChannel(input.channel);
  return `你是 Aether Fate Engine 的产品文案编辑。

【任务】
为「${t?.name ?? input.target}」生成 3 个文案版本（简洁版 / 共鸣版 / 高概念版）。

【目标用户】
${input.targetUser}

【渠道】
${ch?.name ?? input.channel} · 推荐长度 ${ch?.recommendedLength ?? input.desiredLength} · 术语容忍度 ${ch?.jargonTolerance ?? "low"}

【语言层级】
${input.languageLevel}

【来源概念】
${input.sourceConcepts.join("、") || "用户当前结构"}

【硬约束（必须遵守）】
- 不绝对预测未来，不承诺准确率。
- 不输出医疗 / 法律 / 金融 / 心理诊断建议。
- 不过度神秘化（避免「天命」「神谕」类词）。
- 企业渠道去命运化；小红书避免广告感。
- 若来源涉及 Full 60，必须加入隐私提示。

【输出格式】
1) 简洁版（≤2 句）
2) 共鸣版（情绪 + 行动）
3) 高概念版（带结构语言）
最后给出：建议 CTA、3 个备选标题、平台适配度自评（0–100）。

${extraNotes ?? ""}`;
}
