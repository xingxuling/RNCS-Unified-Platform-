// 第一炉模型推荐器：永远优先小模型 + 小样本闭环。
import type { FirstRunRecommendation, FirstRunRiskNote } from "./firstRunReadinessTypes";

export function buildFirstRunRecommendations(): FirstRunRecommendation[] {
  return [
    {
      modelId: "AETHERSEED_300M_PRIVATE",
      modelName: "AetherSeed 300M 私有模型（主线）",
      reason: "当前 Aetherworld 主线唯一目标：训练创始人私有结构化工作脑，未来接入 Ollama。本机长时训练，请高频 checkpoint。",
      recommendedSampleCap: 5000,
    },
    {
      modelId: "AETHERSEED_10M",
      modelName: "AetherSeed-10M（仅作流程验证）",
      reason: "脚本验证级最小模型，仅用于先把数据→训练→checkpoint→评测闭环跑通，不作为主线模型。",
      recommendedSampleCap: 200,
    },
  ];
}

export function buildFirstRunRisks(): FirstRunRiskNote[] {
  return [
    { level: "WARN", text: "当前主线为 AetherSeed 300M 私有模型；300M 本机训练可能需要数天到数周。" },
    { level: "WARN", text: "必须高频保存 checkpoint，确保可断点恢复；不得跳过 dry-run / 用户确认。" },
    { level: "WARN", text: "不得训练未脱敏私密数据、来源不明材料、第三方版权材料。" },
    { level: "INFO", text: "第一炉目标是私有模型闭环（数据→训练→checkpoint→评测→Ollama 接入预留），不是性能竞争。" },
    { level: "INFO", text: "暂时不训练 WebXXM-2 / Router Tiny / MSL Tiny / Format Tiny。" },
  ];
}
