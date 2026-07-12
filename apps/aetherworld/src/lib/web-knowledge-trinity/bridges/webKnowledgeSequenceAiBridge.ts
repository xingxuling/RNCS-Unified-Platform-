// Bridge to Sequence AI – returns context flags & summary structure
export interface SequenceAiTrinityContext {
  useWebKnowledgeTrinity: boolean;
  useWebLkm: boolean;
  useWebCm: boolean;
  useWebCoM: boolean;
  knowledgeRetrievalMode: string;
  calculusSelectionMode: string;
  constantInjectionMode: string;
}
export const DEFAULT_TRINITY_CONTEXT: SequenceAiTrinityContext = {
  useWebKnowledgeTrinity: true, useWebLkm: true, useWebCm: true, useWebCoM: true,
  knowledgeRetrievalMode: "HYBRID_RETRIEVAL",
  calculusSelectionMode: "RULE_BASED",
  constantInjectionMode: "AUTO_BY_TASK_TYPE",
};
