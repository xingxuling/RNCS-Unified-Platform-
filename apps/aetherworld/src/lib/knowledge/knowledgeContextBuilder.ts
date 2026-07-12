// 知识上下文构建器：为其他引擎提供上下文
import { searchKnowledge } from "./knowledgeSearchEngine";
import { collectCitations } from "./knowledgeCitationEngine";
import { evaluateFreshness } from "./knowledgeFreshnessEngine";
import type { KnowledgeEntry, KnowledgeCitation } from "./knowledgeSourceRegistry";
import type { KnowledgeUserMode } from "./knowledgeAccessGuard";

export interface KnowledgeContextRequest {
  userQuery: string;
  targetEngine: string;
  subjectMode: KnowledgeUserMode;
  language?: string;
  maxEntries?: number;
  requireCitations?: boolean;
}

export interface KnowledgeContext {
  contextSummary: string;
  entries: KnowledgeEntry[];
  citations: KnowledgeCitation[];
  missingKnowledge: string[];
  staleWarnings: string[];
  safetyNotes: string[];
}

const ENGINE_TYPE_HINT: Record<string, string[]> = {
  narrative:        ["FICTIONAL_LORE", "PRODUCT_INTERNAL"],
  vocal:            ["FICTIONAL_LORE", "PRODUCT_INTERNAL", "PROMPT_TEMPLATE"],
  modelGeneration:  ["PRODUCT_INTERNAL", "ENGINE_DOC"],
  sequenceWorld:    ["FICTIONAL_LORE", "MSL_KNOWLEDGE"],
  sequenceAI:       ["PRODUCT_INTERNAL", "ENGINE_DOC"],
  translation:      ["MULTILINGUAL_TERM", "PRODUCT_INTERNAL"],
  msl:              ["MSL_KNOWLEDGE"],
  factsQuery:       ["REAL_WORLD_FACT"],
};

export function buildKnowledgeContext(req: KnowledgeContextRequest): KnowledgeContext {
  const max = req.maxEntries ?? 8;
  const hint = ENGINE_TYPE_HINT[req.targetEngine];

  const result = searchKnowledge({
    query: req.userQuery,
    userMode: req.subjectMode,
    language: req.language,
    knowledgeTypes: hint,
  });

  let entries = result.entries.slice(0, max);
  if (entries.length === 0) {
    // 二次尝试不限类型
    entries = searchKnowledge({
      query: req.userQuery,
      userMode: req.subjectMode,
      language: req.language,
    }).entries.slice(0, max);
  }

  const citationReport = collectCitations(entries);
  const staleWarnings: string[] = [];
  entries.forEach(e => {
    const f = evaluateFreshness(e);
    if (f.warning) staleWarnings.push(`「${e.title}」：${f.warning}`);
  });

  const missing: string[] = [];
  if (req.requireCitations && citationReport.citations.length === 0) {
    missing.push("缺少可引用来源，建议补充资料或联网验证。");
  }
  if (req.targetEngine === "factsQuery" && entries.every(e => e.knowledgeType !== "REAL_WORLD_FACT")) {
    missing.push("知识库中未找到与该现实问题匹配的事实条目。");
  }

  const safetyNotes: string[] = [];
  if (entries.some(e => e.knowledgeType === "FICTIONAL_LORE")) {
    safetyNotes.push("已使用虚构设定，请勿当作现实事实输出。");
  }
  if (entries.some(e => e.knowledgeType === "USER_PERSONAL")) {
    safetyNotes.push("已使用用户私有数据，仅在本主体范围内可见。");
  }

  const summary = entries.length === 0
    ? "未找到匹配的知识条目。"
    : `已为「${req.targetEngine}」检索到 ${entries.length} 条知识：${entries.slice(0, 3).map(e => e.title).join("、")}${entries.length > 3 ? " 等" : ""}。`;

  return {
    contextSummary: summary,
    entries,
    citations: citationReport.citations,
    missingKnowledge: missing,
    staleWarnings,
    safetyNotes,
  };
}
