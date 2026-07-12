import type { VocabularyTerm } from "./vocabularyRegistry";

export interface TermVersionRecord {
  version: string;
  updatedAt: string;
  changeType: "INIT" | "DEFINITION_REFINED" | "ALIAS_CHANGED" | "SAFETY_REVISED" | "LOCALIZED" | "DEPRECATED";
  note: string;
}

export function getTermVersionHistory(term: VocabularyTerm): TermVersionRecord[] {
  return [
    { version: term.version, updatedAt: term.updatedAt, changeType: "INIT", note: "首次注册" },
  ];
}
