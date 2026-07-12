// Civilization Myth Engine
import {
  CIVILIZATION_MYTH_FICTION_NOTE, CIVILIZATION_MYTH_LABELS,
  type CivilizationMythType,
} from "@/constants/sequence-world/civilization/civilizationMythTypes";
import type { HistoricalEvent } from "./historicalTimelineEngine";

export interface CivilizationMyth {
  mythId: string;
  title: string;
  sourceHistoricalEvent: string;
  mythType: CivilizationMythType;
  mythLabel: string;
  symbolicMeaning: string;
  ritualUse: string[];
  beliefImpact: number;
  canonLevel: "DRAFT" | "SOFT_CANON" | "HARD_CANON" | "FOUNDER_LOCKED";
  fictionDisclaimer: string;
}

const EVENT_TO_MYTH: Record<string, CivilizationMythType> = {
  FOUNDING: "CREATION_MYTH", CIVILIZATION_COLLAPSE: "FALL_MYTH",
  RESEED_EVENT: "RESEED_MYTH", WAR: "HERO_MYTH",
  BELIEF_SPLIT: "BETRAYAL_MYTH", CATASTROPHE: "VOID_MYTH",
  TECHNOLOGY_BREAKTHROUGH: "STAR_MYTH", INSTITUTION_REFORM: "JUDGMENT_MYTH",
};

export function buildCivilizationMyths(input: {
  worldId: string; events: HistoricalEvent[]; maxMyths?: number;
}): CivilizationMyth[] {
  const max = input.maxMyths ?? 8;
  const out: CivilizationMyth[] = [];
  for (const e of input.events) {
    if (out.length >= max) break;
    const t = EVENT_TO_MYTH[e.eventType];
    if (!t) continue;
    out.push({
      mythId: `${input.worldId}-myth-${out.length}`,
      title: `${CIVILIZATION_MYTH_LABELS[t]}：${e.title}`,
      sourceHistoricalEvent: e.eventId,
      mythType: t,
      mythLabel: CIVILIZATION_MYTH_LABELS[t],
      symbolicMeaning: `以 ${e.title} 为原型的象征叙事`,
      ritualUse: ["每年纪念","入会仪式","战前唱诵"].slice(0, 2),
      beliefImpact: 0.6,
      canonLevel: "SOFT_CANON",
      fictionDisclaimer: CIVILIZATION_MYTH_FICTION_NOTE,
    });
  }
  return out;
}
