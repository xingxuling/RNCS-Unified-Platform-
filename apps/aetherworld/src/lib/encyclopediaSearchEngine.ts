// 百科搜索引擎
import type { EncyclopediaEntry } from "@/constants/encyclopediaSeedEntries";
import { getAllEntries } from "./encyclopediaEngine";

export interface SearchHit {
  entry: EncyclopediaEntry;
  score: number;
  matchedOn: string[];
}

const NORMALIZE = (s: string) => s.toLowerCase().trim();

// 简化的中英文模糊匹配 + 同义词扩展
const SYNONYM_MAP: Record<string, string[]> = {
  "定没定": ["定数", "已定", "半定", "未定", "行动许可"],
  "记录结果": ["回验", "feedback", "记录中心", "回验权重"],
  "看不懂": ["用户语言", "新手", "beginner", "语言适配", "入门"],
  "怎么开始": ["快速开始", "onboarding", "新手", "demo"],
  "演示": ["demo", "demo persona", "演示模型"],
  "我的模型": ["light 20", "full 60", "imported", "real subject", "真实主体"],
  "准不准": ["准确率", "命中率", "accuracy", "回验"],
  "怎么用": ["快速开始", "onboarding", "用户语言"],
};

function expandQuery(q: string): string[] {
  const base = [NORMALIZE(q)];
  for (const [k, v] of Object.entries(SYNONYM_MAP)) {
    if (q.includes(k)) base.push(...v.map(NORMALIZE));
  }
  return Array.from(new Set(base));
}

function scoreEntry(entry: EncyclopediaEntry, q: string): { score: number; matched: string[] } {
  const matched: string[] = [];
  let score = 0;
  const queries = expandQuery(q);

  const check = (text: string | undefined, weight: number, label: string) => {
    if (!text) return;
    const t = NORMALIZE(text);
    for (const qq of queries) {
      if (!qq) continue;
      if (t === qq) { score += weight * 3; matched.push(label); return; }
      if (t.includes(qq)) { score += weight; matched.push(label); return; }
    }
  };

  check(entry.title, 10, "title");
  for (const a of entry.aliases) check(a, 8, "alias");
  check(entry.shortDefinition, 4, "short");
  check(entry.userFriendlyExplanation, 3, "user");
  check(entry.professionalExplanation, 2, "pro");
  for (const t of entry.userLanguageTerms) check(t, 5, "userTerm");
  for (const t of entry.technicalTerms) check(t, 4, "techTerm");
  for (const m of entry.relatedModules) check(m, 3, "module");
  for (const w of entry.whereItAppears) check(w, 2, "where");
  check(entry.category, 2, "category");

  return { score, matched: Array.from(new Set(matched)) };
}

export function searchEncyclopedia(query: string, limit = 30): SearchHit[] {
  const q = query.trim();
  const entries = getAllEntries();
  if (!q) return entries.slice(0, limit).map(e => ({ entry: e, score: 0, matchedOn: [] }));
  const hits: SearchHit[] = [];
  for (const e of entries) {
    const { score, matched } = scoreEntry(e, q);
    if (score > 0) hits.push({ entry: e, score, matchedOn: matched });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
