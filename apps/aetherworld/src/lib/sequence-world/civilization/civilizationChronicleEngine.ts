// Civilization Chronicle Engine
import type { CivilizationEra } from "./eraTransitionEngine";
import type { HistoricalEvent } from "./historicalTimelineEngine";
import type { HistoricalFigure } from "./historicalFigureEngine";
import type { WarPeaceRecord } from "./warPeaceEngine";
import type { CivilizationMyth } from "./civilizationMythEngine";

export interface CivilizationEraSummary {
  eraId: string;
  name: string;
  mood: string;
  highlights: string[];
}

export interface CivilizationChronicle {
  chronicleId: string;
  worldId: string;
  title: string;
  eras: CivilizationEraSummary[];
  majorEvents: HistoricalEvent[];
  majorFigures: HistoricalFigure[];
  majorConflicts: WarPeaceRecord[];
  myths: CivilizationMyth[];
  summary: string;
  narrativeHooks: string[];
}

export function buildChronicle(input: {
  worldId: string;
  eras: CivilizationEra[];
  events: HistoricalEvent[];
  figures: HistoricalFigure[];
  wars: WarPeaceRecord[];
  myths: CivilizationMyth[];
}): CivilizationChronicle {
  const eraSummaries: CivilizationEraSummary[] = input.eras.map(era => ({
    eraId: era.eraId,
    name: era.name,
    mood: era.historicalMood,
    highlights: input.events.filter(e => e.eraId === era.eraId).slice(0, 3).map(e => e.title),
  }));
  const summary = `这是一部跨越 ${input.eras.length} 个时代、${input.events.length} 起历史事件的虚拟文明编年史。`;
  const hooks = [
    "以创始时代的一束光为开篇。",
    "以一次和平条约的破裂作为剧情转折。",
    "以再种子时代的第一颗新生晶为收束。",
  ];
  return {
    chronicleId: `${input.worldId}-chronicle`,
    worldId: input.worldId,
    title: "数列文明编年史",
    eras: eraSummaries,
    majorEvents: input.events.slice(0, 20),
    majorFigures: input.figures.slice(0, 10),
    majorConflicts: input.wars.slice(0, 8),
    myths: input.myths.slice(0, 6),
    summary,
    narrativeHooks: hooks,
  };
}
