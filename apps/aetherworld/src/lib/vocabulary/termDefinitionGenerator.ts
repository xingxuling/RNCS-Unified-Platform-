import type { VocabularyTerm } from "./vocabularyRegistry";

/** 占位：未来可由 AI 生成更长定义。当前返回结构化字段。 */
export function generateTermDefinition(term: VocabularyTerm): {
  short: string; plain: string; technical: string;
} {
  return {
    short: term.shortDefinition,
    plain: term.plainDefinition,
    technical: term.technicalDefinition,
  };
}
