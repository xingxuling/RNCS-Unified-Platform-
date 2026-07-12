import { SEQUENCE_AI_INTENTS, type SequenceAIIntentId, type SequenceAIIntentDef } from "@/constants/sequence-ai/sequenceAIIntents";

export interface SequenceAIIntentResult {
  intent: SequenceAIIntentId;
  confidence: number;
  objectType?: string;
  targetEngine?: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresSubjectProfile: boolean;
  requiresFounderMode: boolean;
  suggestedMode: string;
  matchedKeywords: string[];
  topic: string;
}

function scoreIntent(def: SequenceAIIntentDef, text: string): { score: number; hits: string[] } {
  const lower = text.toLowerCase();
  const hits = def.keywords.filter((k) => lower.includes(k.toLowerCase()));
  return { score: hits.length, hits };
}

function extractTopic(text: string): string {
  const cleaned = text.replace(/[？?。.!！,，；;]/g, " ").trim();
  if (cleaned.length <= 24) return cleaned;
  return cleaned.slice(0, 24) + "…";
}

function inferObjectType(text: string): string | undefined {
  if (/项目|产品|app|应用/i.test(text)) return "PROJECT";
  if (/人|角色|npc|主角/i.test(text)) return "CHARACTER";
  if (/世界|区域|地图/i.test(text)) return "WORLD";
  if (/歌|曲|声/i.test(text)) return "VOCAL";
  if (/剧情|小说|漫画/i.test(text)) return "NARRATIVE";
  if (/模型|schema|结构/i.test(text)) return "MODEL";
  return undefined;
}

const MODE_BY_INTENT: Record<SequenceAIIntentId, string> = {
  ASK_DECISION: "ASK", ANALYZE_OBJECT: "ASK", SOLVE_PROBLEM: "ASK",
  GENERATE_VIRTUAL_LIFE: "CREATE", GENERATE_WORLD: "WORLD",
  GENERATE_MODEL: "CREATE", GENERATE_NARRATIVE: "NARRATIVE",
  GENERATE_VOCAL: "VOCAL", TRANSLATE_LOCALIZE: "TRANSLATE",
  GENERATE_PROMPT: "CREATE", GENERATE_CODE_PLAN: "CODE",
  RUN_QA: "QA", RECALCULATE: "QA",
  EXPORT_ENGINE_DATA: "CREATE", EXPLAIN_TERM: "ASK",
  FOUNDER_SYSTEM_TASK: "FOUNDER", UNKNOWN: "AUTO",
};

export function classifySequenceAIIntent(input: string): SequenceAIIntentResult {
  const text = input.trim();
  if (!text) {
    return {
      intent: "UNKNOWN", confidence: 0, riskLevel: "LOW",
      requiresSubjectProfile: false, requiresFounderMode: false,
      suggestedMode: "AUTO", matchedKeywords: [], topic: "",
    };
  }
  let best = { def: SEQUENCE_AI_INTENTS.find((i) => i.id === "UNKNOWN")!, score: 0, hits: [] as string[] };
  for (const def of SEQUENCE_AI_INTENTS) {
    if (def.id === "UNKNOWN") continue;
    const { score, hits } = scoreIntent(def, text);
    if (score > best.score) best = { def, score, hits };
  }
  const def = best.def;
  const confidence = best.score === 0 ? 0 : Math.min(1, best.score / 2);
  return {
    intent: def.id,
    confidence,
    objectType: inferObjectType(text),
    targetEngine: def.targetEngine,
    riskLevel: def.riskLevel,
    requiresSubjectProfile: !!def.requiresSubjectProfile,
    requiresFounderMode: !!def.requiresFounderMode,
    suggestedMode: MODE_BY_INTENT[def.id],
    matchedKeywords: best.hits,
    topic: extractTopic(text),
  };
}
