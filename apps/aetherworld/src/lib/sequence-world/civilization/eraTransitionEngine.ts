// Era Transition Engine
import { DIGIT_TO_ERA, ERA_LABELS, type EraType } from "@/constants/sequence-world/civilization/eraTypes";

export interface CivilizationEra {
  eraId: string;
  name: string;
  eraType: EraType;
  startTick: number;
  endTick?: number;
  dominantForces: string[];
  dominantDigits: string[];
  mainInstitutions: string[];
  mainFactions: string[];
  historicalMood: string;
  summary: string;
}

const MOOD: Partial<Record<EraType, string>> = {
  VOID_ERA: "寂静、待显化", SEED_ERA: "初生、立根", TRIBAL_ERA: "结群、依存",
  CITY_STATE_ERA: "聚落、自治", GUILD_ERA: "技艺、互助", RULED_CIVILIZATION_ERA: "秩序、法度",
  EXPANSION_ERA: "扩张、机遇", FRACTURE_ERA: "裂变、张力", ARCHIVE_ERA: "封存、沉淀",
  STAR_RELIC_ERA: "遥远、追忆", TERMINAL_ERA: "终局、抉择", RESEED_ERA: "再起、新生",
};

function dominantDigit(digits: string[] = []): string {
  const counts: Record<string, number> = {};
  digits.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
  let best = "1", max = -1;
  Object.entries(counts).forEach(([d, c]) => { if (c > max) { best = d; max = c; } });
  return best;
}

export function generateEra(input: {
  worldId: string; eraIndex: number; startTick: number;
  sourceDigits?: string[]; factions?: string[]; institutions?: string[];
}): CivilizationEra {
  const d = dominantDigit(input.sourceDigits);
  const eraType: EraType = DIGIT_TO_ERA[d] ?? "RULED_CIVILIZATION_ERA";
  return {
    eraId: `${input.worldId}-era-${input.eraIndex}`,
    name: `${ERA_LABELS[eraType]}（第 ${input.eraIndex + 1} 纪）`,
    eraType,
    startTick: input.startTick,
    dominantForces: [],
    dominantDigits: input.sourceDigits ? [d] : [],
    mainInstitutions: input.institutions ?? [],
    mainFactions: input.factions ?? [],
    historicalMood: MOOD[eraType] ?? "演化中",
    summary: `本时代以「${ERA_LABELS[eraType]}」为主调，${MOOD[eraType] ?? ""}。`,
  };
}

export function generateEraSequence(input: {
  worldId: string; steps: number; sourceDigits?: string[];
  factions?: string[]; institutions?: string[];
}): CivilizationEra[] {
  const digits = input.sourceDigits ?? ["1","2","3","4","5","6","7","8","9","0"];
  const eras: CivilizationEra[] = [];
  const steps = Math.max(1, Math.min(input.steps, 12));
  for (let i = 0; i < steps; i++) {
    const slice = digits.slice(i, i + 3).length ? digits.slice(i, i + 3) : [digits[i % digits.length]];
    const e = generateEra({
      worldId: input.worldId, eraIndex: i, startTick: i * 100,
      sourceDigits: slice, factions: input.factions, institutions: input.institutions,
    });
    if (i > 0) eras[i - 1].endTick = e.startTick;
    eras.push(e);
  }
  return eras;
}
