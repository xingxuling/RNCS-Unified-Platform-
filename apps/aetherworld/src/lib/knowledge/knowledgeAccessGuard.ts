// 知识权限守卫
import type { KnowledgeEntry } from "./knowledgeSourceRegistry";

export type KnowledgeUserMode = "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";

export interface AccessFilterResult {
  visible: KnowledgeEntry[];
  hidden: KnowledgeEntry[];
  warnings: string[];
}

export function filterByAccess(entries: KnowledgeEntry[], mode: KnowledgeUserMode): AccessFilterResult {
  const visible: KnowledgeEntry[] = [];
  const hidden: KnowledgeEntry[] = [];
  const warnings: string[] = [];

  for (const e of entries) {
    let allow = true;
    if (e.accessLevel === "SYSTEM_ONLY") allow = false;
    else if (e.accessLevel === "FOUNDER_ONLY") allow = mode === "FOUNDER";
    else if (e.accessLevel === "USER_PRIVATE") allow = mode === "FULL_60" || mode === "FOUNDER";
    if (allow) visible.push(e); else hidden.push(e);
  }
  if (hidden.length) warnings.push(`已隐藏 ${hidden.length} 条受权限保护的条目。`);
  return { visible, hidden, warnings };
}

export function canViewEntry(entry: KnowledgeEntry, mode: KnowledgeUserMode): boolean {
  return filterByAccess([entry], mode).visible.length === 1;
}
