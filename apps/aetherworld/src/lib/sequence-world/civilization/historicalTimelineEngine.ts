// Historical Timeline Engine
import type { CivilizationEra } from "./eraTransitionEngine";

export const HISTORICAL_EVENT_TYPES = [
  "FOUNDING","MIGRATION","DISCOVERY","WAR","PEACE_TREATY","INSTITUTION_REFORM",
  "TECHNOLOGY_BREAKTHROUGH","RESOURCE_CRISIS","BELIEF_SPLIT","CATASTROPHE",
  "RENAISSANCE","CIVILIZATION_COLLAPSE","RESEED_EVENT","USER_INTERVENTION","FOUNDER_DECREE",
] as const;
export type HistoricalEventType = typeof HISTORICAL_EVENT_TYPES[number];

export interface HistoricalEvent {
  eventId: string;
  eraId: string;
  yearOrTick: string;
  title: string;
  eventType: HistoricalEventType;
  summary: string;
  causes: string[];
  effects: string[];
  involvedFactions: string[];
  involvedInstitutions: string[];
  involvedFigures: string[];
  affectedZones: string[];
  memoryImpact: number;
  mythicImpact: number;
  economicImpact: number;
  politicalImpact: number;
  canonLevel: "DRAFT" | "SOFT_CANON" | "HARD_CANON" | "FOUNDER_LOCKED";
}

export interface HistoricalBranchPoint {
  branchId: string;
  atEventId: string;
  alternativeOutcome: string;
}

export interface HistoricalTimeline {
  worldId: string;
  timelineId: string;
  timelineName: string;
  currentEraId: string;
  events: HistoricalEvent[];
  branchPoints: HistoricalBranchPoint[];
  disputedEvents: string[];
  canonLevel: "DRAFT" | "SOFT_CANON" | "HARD_CANON" | "FOUNDER_LOCKED";
}

const EVENT_TEMPLATES: { type: HistoricalEventType; title: string; digit?: string }[] = [
  { type: "FOUNDING", title: "奠基纪事", digit: "1" },
  { type: "MIGRATION", title: "迁徙之路", digit: "2" },
  { type: "DISCOVERY", title: "符号显现", digit: "3" },
  { type: "INSTITUTION_REFORM", title: "制度革新", digit: "4" },
  { type: "WAR", title: "裂变之战", digit: "5" },
  { type: "RENAISSANCE", title: "复兴之春", digit: "6" },
  { type: "BELIEF_SPLIT", title: "隐秘信仰之裂", digit: "7" },
  { type: "TECHNOLOGY_BREAKTHROUGH", title: "市场与工程之跃", digit: "8" },
  { type: "CIVILIZATION_COLLAPSE", title: "星海归档", digit: "9" },
  { type: "RESEED_EVENT", title: "再种子之夜", digit: "0" },
  { type: "RESOURCE_CRISIS", title: "稀缺之冬" },
  { type: "PEACE_TREATY", title: "和解之约" },
  { type: "CATASTROPHE", title: "世界风暴" },
  { type: "USER_INTERVENTION", title: "用户介入" },
];

export function buildHistoricalTimeline(input: {
  worldId: string; eras: CivilizationEra[]; sourceDigits?: string[];
  factions?: { factionId: string; name: string }[];
  maxEvents?: number; userAction?: string;
}): HistoricalTimeline {
  const events: HistoricalEvent[] = [];
  const max = Math.min(input.maxEvents ?? 24, 80);
  const factions = input.factions ?? [];
  let idx = 0;
  for (const era of input.eras) {
    const eraDigit = era.dominantDigits[0];
    const picks = EVENT_TEMPLATES
      .filter(t => !t.digit || t.digit === eraDigit || Math.random() < 0.3)
      .slice(0, 3);
    for (const tpl of picks) {
      if (events.length >= max) break;
      const involvedFacs = factions.slice(idx % Math.max(1, factions.length), (idx % Math.max(1, factions.length)) + 2).map(f => f.factionId);
      events.push({
        eventId: `${input.worldId}-evt-${idx}`,
        eraId: era.eraId,
        yearOrTick: `T+${era.startTick + idx * 5}`,
        title: `${tpl.title}（${era.name}）`,
        eventType: tpl.type,
        summary: `${era.name}：${tpl.title}，由数字${eraDigit ?? "?"}主导。`,
        causes: [`${era.name} 主导力变化`],
        effects: ["社会关系重构","制度演化","集体记忆累积"],
        involvedFactions: involvedFacs,
        involvedInstitutions: era.mainInstitutions.slice(0, 1),
        involvedFigures: [],
        affectedZones: [],
        memoryImpact: 0.4 + (idx % 5) * 0.1,
        mythicImpact: tpl.type === "CATASTROPHE" || tpl.type === "CIVILIZATION_COLLAPSE" ? 0.8 : 0.3,
        economicImpact: tpl.type === "RESOURCE_CRISIS" ? 0.8 : 0.3,
        politicalImpact: tpl.type === "WAR" || tpl.type === "INSTITUTION_REFORM" ? 0.7 : 0.3,
        canonLevel: "SOFT_CANON",
      });
      idx++;
    }
  }
  if (input.userAction && events.length < max) {
    events.push({
      eventId: `${input.worldId}-evt-user-${idx}`,
      eraId: input.eras[input.eras.length - 1]?.eraId ?? "era-0",
      yearOrTick: `T+now`,
      title: `用户介入：${input.userAction.slice(0, 24)}`,
      eventType: "USER_INTERVENTION",
      summary: input.userAction.slice(0, 120),
      causes: ["用户介入"], effects: ["时间线分支可能"],
      involvedFactions: [], involvedInstitutions: [], involvedFigures: [],
      affectedZones: [], memoryImpact: 0.6, mythicImpact: 0.4,
      economicImpact: 0.2, politicalImpact: 0.5, canonLevel: "DRAFT",
    });
  }
  return {
    worldId: input.worldId,
    timelineId: `${input.worldId}-timeline-0`,
    timelineName: "主时间线",
    currentEraId: input.eras[input.eras.length - 1]?.eraId ?? "",
    events,
    branchPoints: [],
    disputedEvents: [],
    canonLevel: "SOFT_CANON",
  };
}
