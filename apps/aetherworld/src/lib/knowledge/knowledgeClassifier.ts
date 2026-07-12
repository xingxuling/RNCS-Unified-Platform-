// 知识分类器：基于关键字推断 knowledgeType
import type { KnowledgeTypeId } from "@/constants/knowledge/knowledgeTypes";

interface Rule {
  type: KnowledgeTypeId;
  keywords: string[];
}

const RULES: Rule[] = [
  { type: "FICTIONAL_LORE",   keywords: ["蓝天机", "云澜星禾", "天策府", "神明", "Aetherworld 世界观", "BlueSky"] },
  { type: "MSL_KNOWLEDGE",    keywords: ["MSL", "55555", "五域", "opcode", "母体数列", "Block 49"] },
  { type: "USER_PERSONAL",    keywords: ["我的数列", "Full60", "个人主体", "私有记录", "我的偏好"] },
  { type: "ENGINE_DOC",       keywords: ["引擎文档", "Engine Doc", "SDK", "接口说明"] },
  { type: "PRODUCT_INTERNAL", keywords: ["产品模块", "路由", "Recalculation", "Product Encyclopedia", "QA"] },
  { type: "REAL_WORLD_FACT",  keywords: ["法律", "政策", "价格", "市场", "最新", "新闻", "汇率", "GDP"] },
  { type: "PROMPT_TEMPLATE",  keywords: ["Prompt", "提示词", "Suno", "Udio", "Lovable Prompt"] },
  { type: "MULTILINGUAL_TERM",keywords: ["术语", "翻译", "terminology", "i18n"] },
  { type: "VALIDATION_DATA",  keywords: ["回验", "命中", "偏差", "feedback log"] },
  { type: "SOURCE_QUOTE",     keywords: ["引用", "原文", "quote"] },
  { type: "DEMO_DATA",        keywords: ["示例", "demo", "演示"] },
];

export interface ClassificationResult {
  type: KnowledgeTypeId;
  confidence: number;
  matchedKeywords: string[];
  alternates: { type: KnowledgeTypeId; confidence: number }[];
}

export function classifyKnowledge(text: string): ClassificationResult {
  const lower = text.toLowerCase();
  const scores = RULES.map(r => {
    const matched = r.keywords.filter(k => lower.includes(k.toLowerCase()));
    return { type: r.type, score: matched.length, matched };
  }).sort((a, b) => b.score - a.score);
  const top = scores[0];
  if (!top || top.score === 0) {
    return { type: "UNKNOWN", confidence: 0.2, matchedKeywords: [], alternates: [] };
  }
  const confidence = Math.min(0.95, 0.4 + top.score * 0.15);
  return {
    type: top.type,
    confidence,
    matchedKeywords: top.matched,
    alternates: scores.slice(1, 4).filter(s => s.score > 0).map(s => ({ type: s.type, confidence: Math.min(0.8, 0.3 + s.score * 0.1) })),
  };
}
