// AetherSeed-VL Chat 接入（关键词命中 -> 训练卡片摘要）
import { getVlmSampleStats } from "./vlmSampleStore";
import { listVlmDatasetVersions } from "./vlmDatasetVersioner";
import { listVlmExperiments } from "./vlmExperimentLedger";

export interface VlmChatCard {
  title: string;
  lines: string[];
  cta: string;
  href: string;
}

export function answerVlmChat(query: string): VlmChatCard | null {
  const q = query.toLowerCase();
  const hit =
    q.includes("vl") ||
    q.includes("多模态") ||
    q.includes("图文") ||
    q.includes("截图") ||
    q.includes("vlm") ||
    q.includes("aetherseed-vl");
  if (!hit) return null;

  const stats = getVlmSampleStats();
  const versions = listVlmDatasetVersions();
  const experiments = listVlmExperiments();
  const last = experiments[0];

  const lines = [
    `图文样本数：${stats.sampleCount}（图片 ${stats.imageCount}）`,
    `UI 截图：${stats.perType.UI_SCREENSHOT_QA}｜角色：${stats.perType.CHARACTER_IMAGE_QA}｜符号：${stats.perType.SYMBOL_IMAGE_QA}｜图表：${stats.perType.DIAGRAM_IMAGE_QA}`,
    `数据集版本：${versions[0]?.name ?? "尚未构建"}`,
    `底座模型：${last?.baseModelId ?? "尚未选择"}（默认推荐 LoRA / SFT，不建议从零训练）`,
    `dry-run / 本地网关：均需人工确认后才会执行`,
    `推理接入：默认 Transformers 本地，不假设所有 VLM 直接 Ollama`,
  ];

  return {
    title: "AetherSeed-VL 多模态训练卡片",
    lines,
    cta: "前往 /system/aetherseed-vl",
    href: "/system/aetherseed-vl",
  };
}
