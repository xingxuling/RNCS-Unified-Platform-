// 百科交叉链接器：根据条目内容生成相关条目建议
import type { EncyclopediaEntry } from "@/constants/encyclopediaSeedEntries";
import { getAllEntries, getEntryById } from "./encyclopediaEngine";

export interface CrossLink {
  id: string;
  title: string;
  reason: string;
}

export function resolveCrossLinks(entry: EncyclopediaEntry): CrossLink[] {
  const all = getAllEntries();
  const explicit: CrossLink[] = (entry.relatedEntries ?? [])
    .map(id => getEntryById(id))
    .filter((e): e is EncyclopediaEntry => !!e)
    .map(e => ({ id: e.id, title: e.title, reason: "显式相关" }));

  // 隐式：同分类 + 共享技术术语
  const implicit: CrossLink[] = [];
  for (const other of all) {
    if (other.id === entry.id) continue;
    if (explicit.find(x => x.id === other.id)) continue;
    let hit = false;
    let reason = "";
    if (other.category === entry.category) { hit = true; reason = "同分类"; }
    const sharedTerms = (entry.technicalTerms ?? []).filter(t => other.technicalTerms?.includes(t));
    if (sharedTerms.length > 0) { hit = true; reason = `共享术语 ${sharedTerms[0]}`; }
    if (hit) implicit.push({ id: other.id, title: other.title, reason });
  }
  return [...explicit, ...implicit.slice(0, 6)];
}

export function resolveBacklinks(entryId: string): CrossLink[] {
  const all = getAllEntries();
  return all
    .filter(e => e.relatedEntries?.includes(entryId))
    .map(e => ({ id: e.id, title: e.title, reason: "被引用" }));
}
