import type { AetherConcept, AetherConceptChain } from "./webLcmTypes";
import { newId } from "./webLcmTypes";

export type ConceptChainType =
  | "INTENT_TO_OUTPUT_CHAIN"
  | "OBJECT_TO_WORKFLOW_CHAIN"
  | "WORLD_TO_NARRATIVE_CHAIN"
  | "WORLD_TO_VOCAL_CHAIN"
  | "APP_IDEA_TO_PROJECT_CHAIN"
  | "ERROR_TO_PATCH_CHAIN"
  | "CALCULUS_TO_ACTION_CHAIN"
  | "SUBJECT_TO_STYLE_CHAIN"
  | "KNOWLEDGE_TO_PROMPT_CHAIN"
  | "CONCEPT_TO_WEBLLM_CHAIN";

export interface BuildChainOptions {
  title?: string;
  chainType?: ConceptChainType;
}

export function buildConceptChain(concepts: AetherConcept[], opts: BuildChainOptions = {}): AetherConceptChain {
  const ordered = [...concepts].sort((a, b) => {
    const lvl: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, META: 3 };
    return (lvl[a.abstractionLevel] ?? 0) - (lvl[b.abstractionLevel] ?? 0);
  });
  const titleSeed = opts.title ?? (ordered[0]?.title ?? "概念链");
  const summary = ordered.slice(0, 5).map(c => c.title).join(" → ");
  const expansionPrompt = [
    `概念链：${summary}`,
    `请基于以下核心概念展开输出：`,
    ...ordered.slice(0, 6).map((c, i) => `${i + 1}. [${c.conceptType}] ${c.title} — ${c.summary}`),
    `输出需遵循 Aetherworld 安全边界与 System Constitution。`,
  ].join("\n");
  return {
    chainId: newId("chain"),
    title: `${titleSeed} 链`,
    sourceConceptIds: ordered.map(c => c.conceptId),
    orderedConcepts: ordered,
    chainType: opts.chainType ?? "INTENT_TO_OUTPUT_CHAIN",
    predictedNextConcepts: [],
    compressionSummary: summary,
    expansionPrompt,
    qaStatus: "PENDING",
    createdAt: new Date().toISOString(),
  };
}
