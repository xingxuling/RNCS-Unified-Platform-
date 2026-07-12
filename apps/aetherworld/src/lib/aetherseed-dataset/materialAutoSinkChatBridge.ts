// 材料工厂自动入库 · Chat 桥
import type { MaterialAutoSinkCard } from "./materialAutoSinkTypes";
import { AUTO_SINK_MODE_LABEL } from "./materialAutoSinkTypes";
import { latestMaterialSinkResult } from "./materialAutoSink";

const KEYWORDS = [
  "材料工厂",
  "自动入库",
  "短样本",
  "中长样本",
  "中样本",
  "长样本",
  "raw corpus",
  "rawcorpus",
  "原始语料",
  "long corpus",
  "longcorpus",
  "长语料",
  "full corpus",
  "fullcorpus",
  "吸收率",
  "混合切片",
];

export function isMaterialAutoSinkQuery(text: string): boolean {
  const q = (text || "").toLowerCase();
  return KEYWORDS.some((k) => q.includes(k.toLowerCase()));
}

export function buildMaterialAutoSinkCard(question: string): MaterialAutoSinkCard {
  const last = latestMaterialSinkResult();
  if (!last) {
    return {
      question,
      explanation:
        "尚未检测到材料工厂自动入库记录。请先在 /system/intake-forge 选择「混合切片」模式投喂材料；" +
        "系统会同时写入 RawCorpusDocument、LongCorpusChunk、中样本、长样本与短样本，避免「样本数多但中长样本占比 0%」的问题。",
      rawTokens: 0,
      shortSamples: 0,
      mediumSamples: 0,
      longChunks: 0,
      absorptionRate: 0,
      midLongShare: 0,
      autoSinkMode: "HYBRID",
      autoSinkModeLabel: AUTO_SINK_MODE_LABEL.HYBRID,
      nextAction: "在 /system/intake-forge 用混合切片重新投喂一段长文本。",
      warnings: [],
    };
  }

  let nextAction = "材料吸收完整，可继续投喂或前往 /system/datasets 构建 Full Corpus。";
  if (last.midLongShare < 0.3 && last.rawTokens >= 800) {
    nextAction = "中长样本占比偏低：请把吸收模式切换为「混合切片」或「全量吸收」，重新按混合切片入库最近一次投喂。";
  } else if (last.longChunksCreated === 0 && last.rawTokens >= 800) {
    nextAction = "原文超过 800 token 但未生成 LongCorpusChunk：请确认吸收模式不是「仅短样本」。";
  } else if (last.fullCorpusCandidateId) {
    nextAction = `Full Corpus 候选 ${last.fullCorpusCandidateId} 已生成，可在 /system/datasets 真实导出。`;
  }

  return {
    question,
    explanation:
      `最近一次材料工厂自动入库（${last.autoSinkMode}） · 原始 token ${last.rawTokens}、` +
      `短样本 ${last.shortSamplesCreated}、中样本 ${last.mediumSamplesCreated}、` +
      `长语料切片 ${last.longChunksCreated}、评测 ${last.evalSamplesCreated}。` +
      `吸收率 ${(last.absorptionRate * 100).toFixed(1)}%，中长样本占比 ${(last.midLongShare * 100).toFixed(1)}%。` +
      (last.warnings.length > 0 ? ` 警告：${last.warnings.join("；")}` : ""),
    rawTokens: last.rawTokens,
    shortSamples: last.shortSamplesCreated,
    mediumSamples: last.mediumSamplesCreated,
    longChunks: last.longChunksCreated,
    absorptionRate: last.absorptionRate,
    midLongShare: last.midLongShare,
    autoSinkMode: last.autoSinkMode,
    autoSinkModeLabel: AUTO_SINK_MODE_LABEL[last.autoSinkMode],
    fullCorpusCandidateId: last.fullCorpusCandidateId,
    nextAction,
    warnings: last.warnings,
  };
}
