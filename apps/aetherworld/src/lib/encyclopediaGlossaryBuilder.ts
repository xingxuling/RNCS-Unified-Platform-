// 从百科条目生成术语表（供 Product Docs / Language Fit 消费）
import { getAllEntries } from "./encyclopediaEngine";

export interface GlossaryItem {
  term: string;
  shortDefinition: string;
  category: string;
  entryId: string;
  userLanguage: string;
}

export function buildGlossary(): GlossaryItem[] {
  const items: GlossaryItem[] = [];
  for (const e of getAllEntries()) {
    items.push({
      term: e.title,
      shortDefinition: e.shortDefinition,
      category: e.category,
      entryId: e.id,
      userLanguage: e.userFriendlyExplanation,
    });
    for (const a of e.aliases) {
      items.push({
        term: a,
        shortDefinition: e.shortDefinition,
        category: e.category,
        entryId: e.id,
        userLanguage: e.userFriendlyExplanation,
      });
    }
  }
  return items.sort((a, b) => a.term.localeCompare(b.term, "zh"));
}

export function findGlossaryForTerm(term: string): GlossaryItem | undefined {
  return buildGlossary().find(g => g.term === term);
}
