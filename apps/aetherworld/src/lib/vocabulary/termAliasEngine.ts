import { VOCABULARY_REGISTRY, type VocabularyTerm } from "./vocabularyRegistry";

/** 通过别名定位词条。 */
export function findByAlias(alias: string): VocabularyTerm | undefined {
  const k = alias.trim().toLowerCase();
  return VOCABULARY_REGISTRY.find((t) =>
    t.chineseTerm.toLowerCase() === k ||
    t.englishTerm.toLowerCase() === k ||
    (t.aliases ?? []).some((a) => a.toLowerCase() === k),
  );
}

export function allAliases(): { termId: string; alias: string }[] {
  return VOCABULARY_REGISTRY.flatMap((t) =>
    (t.aliases ?? []).map((a) => ({ termId: t.termId, alias: a })),
  );
}
