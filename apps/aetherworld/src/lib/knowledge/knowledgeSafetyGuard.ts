// 知识安全守卫
import { KNOWLEDGE_SAFETY_NOTE, KNOWLEDGE_SAFETY_RULES, type KnowledgeSafetyRule } from "@/constants/knowledge/knowledgeSafetyRules";
import type { KnowledgeEntry } from "./knowledgeSourceRegistry";

export interface KnowledgeSafetyResult {
  passed: boolean;
  triggered: KnowledgeSafetyRule[];
  note: string;
}

export function runKnowledgeSafety(entries: KnowledgeEntry[]): KnowledgeSafetyResult {
  const triggered: KnowledgeSafetyRule[] = [];

  for (const e of entries) {
    if (e.knowledgeType === "FICTIONAL_LORE" && (e.tags.includes("fact") || e.knowledgeType as string === "REAL_WORLD_FACT")) {
      triggered.push(KNOWLEDGE_SAFETY_RULES[0]);
    }
    if (e.knowledgeType === "DEMO_DATA" && (e.trustLevel === "VERIFIED" || e.trustLevel === "FOUNDER_LOCKED")) {
      triggered.push(KNOWLEDGE_SAFETY_RULES[1]);
    }
    if (e.knowledgeType === "USER_PERSONAL" && e.accessLevel === "PUBLIC") {
      triggered.push(KNOWLEDGE_SAFETY_RULES[2]);
    }
    if (e.citationRequired && (!e.citations || e.citations.length === 0) && e.trustLevel === "VERIFIED") {
      triggered.push(KNOWLEDGE_SAFETY_RULES[3]);
    }
    if (e.stale && (e.freshnessLevel === "TIME_SENSITIVE" || e.freshnessLevel === "LIVE_REQUIRED")) {
      triggered.push(KNOWLEDGE_SAFETY_RULES[4]);
    }
  }
  // dedupe
  const dedup = Array.from(new Map(triggered.map(t => [t.id, t])).values());
  return { passed: dedup.length === 0, triggered: dedup, note: KNOWLEDGE_SAFETY_NOTE };
}

export const KNOWLEDGE_SAFETY_DISCLAIMER = KNOWLEDGE_SAFETY_NOTE;
