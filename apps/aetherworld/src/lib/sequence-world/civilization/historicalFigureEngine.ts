// Historical Figure Engine
import {
  HISTORICAL_FIGURE_FICTION_NOTE, HISTORICAL_FIGURE_LABELS,
  type HistoricalFigureType,
} from "@/constants/sequence-world/civilization/historicalFigureTypes";
import type { CivilizationEra } from "./eraTransitionEngine";

export interface HistoricalFigure {
  figureId: string;
  name: string;
  originAgentId?: string;
  figureType: HistoricalFigureType;
  figureLabel: string;
  eraId: string;
  roleInHistory: string;
  achievements: string[];
  controversies: string[];
  mythicStatus: number;
  rememberedBy: string[];
  canonLevel: "DRAFT" | "SOFT_CANON" | "HARD_CANON" | "FOUNDER_LOCKED";
  fictionDisclaimer: string;
}

const DIGIT_FIGURE: Record<string, HistoricalFigureType[]> = {
  "1": ["FOUNDER"], "2": ["PEACEMAKER","WANDERER"], "3": ["PROPHET"],
  "4": ["JUDGE","REFORMER"], "5": ["CONQUEROR"], "6": ["PEACEMAKER","MARTYR"],
  "7": ["WANDERER","BETRAYER"], "8": ["ENGINEER"], "9": ["PROPHET","ARCHIVIST"],
  "0": ["ARCHIVIST"],
};

const NAMES = ["岚行","澈言","渊知","祁焰","槿光","稷砚","遥昭","旸石","沐辰","煊默","琢心","纾安"];

export function buildHistoricalFigures(input: {
  worldId: string; eras: CivilizationEra[]; agents?: { agentId: string; name: string }[];
  sourceDigits?: string[]; maxFigures?: number;
}): HistoricalFigure[] {
  const d = input.sourceDigits ?? [];
  const types: HistoricalFigureType[] = [];
  d.forEach(x => (DIGIT_FIGURE[x] ?? []).forEach(t => { if (!types.includes(t)) types.push(t); }));
  if (types.length === 0) types.push("FOUNDER","PEACEMAKER");
  const max = Math.min(input.maxFigures ?? 8, 30);
  const figures: HistoricalFigure[] = [];
  for (let i = 0; i < Math.min(max, types.length * 2); i++) {
    const t = types[i % types.length];
    const era = input.eras[i % input.eras.length];
    const agent = input.agents?.[i % Math.max(1, input.agents?.length ?? 1)];
    figures.push({
      figureId: `${input.worldId}-figure-${i}`,
      name: agent?.name ?? NAMES[i % NAMES.length],
      originAgentId: agent?.agentId,
      figureType: t,
      figureLabel: HISTORICAL_FIGURE_LABELS[t],
      eraId: era?.eraId ?? "",
      roleInHistory: `在 ${era?.name ?? ""} 担任 ${HISTORICAL_FIGURE_LABELS[t]}`,
      achievements: [`推动 ${era?.name ?? ""} 的核心事件`],
      controversies: t === "BETRAYER" ? ["立场反复，被多个阵营争议"] : [],
      mythicStatus: t === "PROPHET" || t === "FOUNDER" ? 0.8 : 0.4,
      rememberedBy: [],
      canonLevel: "SOFT_CANON",
      fictionDisclaimer: HISTORICAL_FIGURE_FICTION_NOTE,
    });
  }
  return figures;
}
