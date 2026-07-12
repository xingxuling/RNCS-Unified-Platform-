// 反馈吸收器 · 把反馈转成任务 / 样本候选 / 提示词草案
import { saveFeedback } from "./localAgiStore";
import type {
  AbsorbOutput,
  AbsorbOutputKind,
  FeedbackItem,
  FeedbackSource,
} from "./localAgiTypes";

function nid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function classifyKinds(source: FeedbackSource, content: string): AbsorbOutputKind[] {
  const c = content.toLowerCase();
  const kinds = new Set<AbsorbOutputKind>();
  if (source === "USER_CHAT") {
    kinds.add("TRAINING_SAMPLE");
    if (c.includes("不好用") || c.includes("难用") || c.includes("丑")) kinds.add("UX_TASK");
    if (c.includes("想要") || c.includes("应该") || c.includes("加个")) kinds.add("DEV_TASK");
  }
  if (source === "LOVABLE_REPORT") {
    kinds.add("DEV_TASK");
    kinds.add("TRAINING_SAMPLE");
  }
  if (source === "ERROR_LOG" || source === "BUG_AUDIT") {
    kinds.add("BUG_AUDIT_ITEM");
    kinds.add("DEV_TASK");
  }
  if (source === "TRAINING_FAIL") {
    kinds.add("FACTORY_TASK");
    kinds.add("DATASET_CANDIDATE");
  }
  if (source === "BROKEN_PAGE") {
    kinds.add("DEV_TASK");
    kinds.add("LOVABLE_PROMPT");
  }
  if (source === "USER_IDEA") {
    kinds.add("DEV_TASK");
    kinds.add("LOVABLE_PROMPT");
  }
  if (kinds.size === 0) kinds.add("DEV_TASK");
  return Array.from(kinds);
}

function buildOutput(kind: AbsorbOutputKind, content: string): AbsorbOutput {
  const title =
    kind === "LOVABLE_PROMPT"
      ? `Lovable 提示词草案：${content.slice(0, 24)}`
      : kind === "DEV_TASK"
      ? `开发任务：${content.slice(0, 24)}`
      : kind === "TRAINING_SAMPLE"
      ? `训练样本候选：${content.slice(0, 24)}`
      : kind === "DATASET_CANDIDATE"
      ? `数据集候选：${content.slice(0, 24)}`
      : kind === "BUG_AUDIT_ITEM"
      ? `Bug 审计项：${content.slice(0, 24)}`
      : kind === "UX_TASK"
      ? `体验改进：${content.slice(0, 24)}`
      : `工厂任务：${content.slice(0, 24)}`;
  const payload =
    kind === "LOVABLE_PROMPT"
      ? `请基于以下反馈生成下一轮 Lovable 提示词：\n${content}\n要求：中文、给出验收标准、不破坏已有模块。`
      : content;
  return {
    id: nid("abs"),
    kind,
    title,
    payload,
    createdAt: new Date().toISOString(),
  };
}

export function recordFeedback(source: FeedbackSource, content: string): FeedbackItem {
  const item: FeedbackItem = {
    id: nid("fb"),
    source,
    content,
    createdAt: new Date().toISOString(),
    absorbed: false,
    outputs: [],
  };
  return saveFeedback(item);
}

export function absorbFeedback(item: FeedbackItem): FeedbackItem {
  if (item.absorbed) return item;
  const kinds = classifyKinds(item.source, item.content);
  const outputs = kinds.map((k) => buildOutput(k, item.content));
  const next: FeedbackItem = { ...item, absorbed: true, outputs };
  return saveFeedback(next);
}

export function absorbAllPending(items: FeedbackItem[]): FeedbackItem[] {
  return items.filter((x) => !x.absorbed).map((x) => absorbFeedback(x));
}
