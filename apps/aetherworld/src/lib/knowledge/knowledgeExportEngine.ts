// 知识导出
import type { KnowledgeEntry } from "./knowledgeSourceRegistry";
import { detectKnowledgeConflicts } from "./knowledgeConflictDetector";
import { evaluateFreshness } from "./knowledgeFreshnessEngine";
import { collectCitations } from "./knowledgeCitationEngine";

export function exportKnowledgeJSON(entries: KnowledgeEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function exportProductKnowledgeMarkdown(entries: KnowledgeEntry[]): string {
  const lines: string[] = ["# Aetherworld Product Knowledge", ""];
  const product = entries.filter(e => e.knowledgeType === "PRODUCT_INTERNAL" || e.knowledgeType === "ENGINE_DOC");
  product.forEach(e => {
    lines.push(`## ${e.title}`);
    lines.push(`> ${e.summary}`);
    lines.push("");
    lines.push(e.body);
    lines.push("");
  });
  return lines.join("\n");
}

export function exportFounderLocked(entries: KnowledgeEntry[]): string {
  return JSON.stringify(entries.filter(e => e.trustLevel === "FOUNDER_LOCKED" || e.accessLevel === "FOUNDER_ONLY"), null, 2);
}

export function exportPublicKnowledge(entries: KnowledgeEntry[]): string {
  return JSON.stringify(entries.filter(e => e.accessLevel === "PUBLIC"), null, 2);
}

export function exportPrivateUserBackup(entries: KnowledgeEntry[]): string {
  return JSON.stringify(entries.filter(e => e.accessLevel === "USER_PRIVATE"), null, 2);
}

export function exportConflictReport(entries: KnowledgeEntry[]): string {
  const conflicts = detectKnowledgeConflicts(entries);
  const lines = ["# Knowledge Conflict Report", ""];
  if (!conflicts.length) lines.push("未检测到知识冲突。");
  conflicts.forEach(c => {
    lines.push(`## ${c.conflictType} · ${c.severity}`);
    lines.push(c.explanation);
    lines.push(`修复建议：${c.suggestedFix}`);
    lines.push("");
  });
  return lines.join("\n");
}

export function exportStaleReport(entries: KnowledgeEntry[]): string {
  const lines = ["# Stale Knowledge Report", ""];
  const stale = entries.map(e => ({ e, f: evaluateFreshness(e) })).filter(x => x.f.stale);
  if (!stale.length) lines.push("没有过期条目。");
  stale.forEach(({ e, f }) => {
    lines.push(`- 【${e.knowledgeType}】${e.title} — ${f.warning ?? `${f.ageDays} 天未更新`}`);
  });
  return lines.join("\n");
}

export function exportCitationsReport(entries: KnowledgeEntry[]): string {
  const rep = collectCitations(entries);
  const lines = ["# Citations Report", ""];
  if (rep.citations.length === 0) lines.push("当前知识库没有引用。");
  rep.citations.forEach(c => lines.push(`- ${c.label}${c.url ? ` (${c.url})` : ""}${c.fileName ? ` [${c.fileName}]` : ""}`));
  if (rep.missingCitations.length) {
    lines.push("");
    lines.push("## 缺少来源");
    rep.missingCitations.forEach(t => lines.push(`- ${t}`));
  }
  return lines.join("\n");
}
