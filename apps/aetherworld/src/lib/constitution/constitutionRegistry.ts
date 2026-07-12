// System Constitution v0.2 — Registry
import { CONSTITUTIONAL_ARTICLES, CONSTITUTION_VERSION, type ConstitutionArticle, type ArticleCategory } from "@/constants/constitution/constitutionalArticles";

export { CONSTITUTION_VERSION };
export type { ConstitutionArticle, ArticleCategory };

export const CONSTITUTION_REGISTRY: ConstitutionArticle[] = CONSTITUTIONAL_ARTICLES;

export function getArticle(id: string): ConstitutionArticle | undefined {
  return CONSTITUTION_REGISTRY.find((a) => a.articleId === id);
}

export function listByCategory(cat: ArticleCategory): ConstitutionArticle[] {
  return CONSTITUTION_REGISTRY.filter((a) => a.category === cat);
}

export function searchArticles(q: string): ConstitutionArticle[] {
  const s = q.toLowerCase();
  return CONSTITUTION_REGISTRY.filter(
    (a) => a.articleId.toLowerCase().includes(s) || a.title.toLowerCase().includes(s) || a.summary.toLowerCase().includes(s) || a.body.toLowerCase().includes(s)
  );
}

export function countByCategory(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of CONSTITUTION_REGISTRY) out[a.category] = (out[a.category] ?? 0) + 1;
  return out;
}
