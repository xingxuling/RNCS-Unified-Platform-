// 知识冲突检测
import type { KnowledgeEntry } from "./knowledgeSourceRegistry";

export interface KnowledgeConflict {
  conflictType: string;
  entries: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
  suggestedFix: string;
}

export function detectKnowledgeConflicts(entries: KnowledgeEntry[]): KnowledgeConflict[] {
  const out: KnowledgeConflict[] = [];

  // 1. 同一术语多种定义
  const titleMap = new Map<string, KnowledgeEntry[]>();
  entries.forEach(e => {
    const key = e.title.trim().toLowerCase();
    const arr = titleMap.get(key) ?? [];
    arr.push(e);
    titleMap.set(key, arr);
  });
  titleMap.forEach((arr, key) => {
    if (arr.length > 1) {
      out.push({
        conflictType: "DUPLICATE_DEFINITION",
        entries: arr.map(a => a.id),
        severity: "MEDIUM",
        explanation: `术语「${key}」存在 ${arr.length} 个定义。`,
        suggestedFix: "合并条目或明确各自适用范围。",
      });
    }
  });

  // 2. FICTIONAL_LORE 被当成 REAL_WORLD_FACT
  entries.forEach(e => {
    if (e.knowledgeType === "REAL_WORLD_FACT" && (e.tags.includes("lore") || e.tags.includes("bluesky"))) {
      out.push({
        conflictType: "LORE_AS_FACT",
        entries: [e.id],
        severity: "HIGH",
        explanation: `条目「${e.title}」被标记为现实事实，但包含虚构 LORE 标签。`,
        suggestedFix: "改为 FICTIONAL_LORE 或移除 lore 标签。",
      });
    }
  });

  // 3. USER_PERSONAL 被公开
  entries.forEach(e => {
    if (e.knowledgeType === "USER_PERSONAL" && e.accessLevel === "PUBLIC") {
      out.push({
        conflictType: "USER_PRIVATE_EXPOSED",
        entries: [e.id],
        severity: "CRITICAL",
        explanation: `用户私有条目「${e.title}」被设为 PUBLIC。`,
        suggestedFix: "改为 USER_PRIVATE 或 FOUNDER_ONLY。",
      });
    }
  });

  // 4. Demo 被标记为高信任
  entries.forEach(e => {
    if (e.knowledgeType === "DEMO_DATA" && (e.trustLevel === "VERIFIED" || e.trustLevel === "FOUNDER_LOCKED")) {
      out.push({
        conflictType: "DEMO_AS_REAL",
        entries: [e.id],
        severity: "HIGH",
        explanation: `演示数据「${e.title}」被标记为高信任。`,
        suggestedFix: "下调为 LOW 或 MEDIUM。",
      });
    }
  });

  // 5. 现实事实无来源但 VERIFIED
  entries.forEach(e => {
    if (e.knowledgeType === "REAL_WORLD_FACT" && e.trustLevel === "VERIFIED" && (!e.citations || e.citations.length === 0)) {
      out.push({
        conflictType: "VERIFIED_WITHOUT_CITATION",
        entries: [e.id],
        severity: "HIGH",
        explanation: `条目「${e.title}」声称已验证但缺少引用。`,
        suggestedFix: "补充至少一个引用来源。",
      });
    }
  });

  return out;
}
