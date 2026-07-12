// 引用引擎
import type { KnowledgeCitation, KnowledgeEntry } from "./knowledgeSourceRegistry";

export interface CitationReport {
  entries: KnowledgeEntry[];
  citations: KnowledgeCitation[];
  missingCitations: string[];
  note?: string;
}

export function collectCitations(entries: KnowledgeEntry[]): CitationReport {
  const citations: KnowledgeCitation[] = [];
  const missing: string[] = [];
  for (const e of entries) {
    if (e.citations && e.citations.length) {
      citations.push(...e.citations);
    } else if (e.citationRequired) {
      missing.push(e.title);
    }
  }
  let note: string | undefined;
  if (missing.length) {
    note = `当前知识库没有可引用来源：${missing.join("、")}；建议补充资料或联网验证。`;
  }
  return { entries, citations, missingCitations: missing, note };
}

export function formatCitationLine(c: KnowledgeCitation): string {
  const parts: string[] = [c.label];
  if (c.fileName) parts.push(`文件：${c.fileName}`);
  if (c.url) parts.push(`链接：${c.url}`);
  if (c.page != null) parts.push(`第 ${c.page} 页`);
  if (c.quote) parts.push(`原文：${c.quote}`);
  return parts.join(" · ");
}
