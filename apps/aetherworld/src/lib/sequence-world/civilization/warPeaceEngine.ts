// War Peace Engine
import { WAR_PEACE_FICTION_NOTE, WAR_PEACE_LABELS, type WarPeaceType } from "@/constants/sequence-world/civilization/warPeaceTypes";
import type { CivilizationEra } from "./eraTransitionEngine";

export interface WarPeaceRecord {
  recordId: string;
  conflictName: string;
  warPeaceType: WarPeaceType;
  warPeaceLabel: string;
  involvedFactions: string[];
  rootCause: string;
  startEra: string;
  endEra?: string;
  intensity: number;
  casualtiesAbstract: string;
  consequences: string[];
  peaceTerms?: string[];
  memoryImpact: number;
  fictionDisclaimer: string;
}

export function buildWarPeaceRecords(input: {
  worldId: string; eras: CivilizationEra[];
  factions: { factionId: string; name: string }[];
  sourceDigits?: string[]; maxRecords?: number;
}): WarPeaceRecord[] {
  const d = input.sourceDigits ?? [];
  const hasWar = d.includes("5");
  const records: WarPeaceRecord[] = [];
  const max = input.maxRecords ?? 8;
  const types: WarPeaceType[] = hasWar
    ? ["RESOURCE_WAR","FAITH_WAR","BORDER_CONFLICT","COLD_WAR","ALLIANCE_WAR","PEACE_TREATY","RECONCILIATION","CIVIL_WAR"]
    : ["BORDER_CONFLICT","COLD_WAR","PEACE_TREATY","RECONCILIATION"];
  for (let i = 0; i < Math.min(max, types.length); i++) {
    const t = types[i];
    const era = input.eras[i % input.eras.length];
    const facs = input.factions.slice(i % Math.max(1, input.factions.length), (i % Math.max(1, input.factions.length)) + 2);
    records.push({
      recordId: `${input.worldId}-war-${i}`,
      conflictName: `${era?.name ?? ""} · ${WAR_PEACE_LABELS[t]}`,
      warPeaceType: t,
      warPeaceLabel: WAR_PEACE_LABELS[t],
      involvedFactions: facs.map(f => f.factionId),
      rootCause: t.includes("RESOURCE") ? "稀缺资源争夺" : t.includes("FAITH") ? "信仰分歧" : "边界与制度张力",
      startEra: era?.eraId ?? "",
      endEra: era?.eraId,
      intensity: t === "PEACE_TREATY" || t === "RECONCILIATION" ? 0.2 : 0.6 + (hasWar ? 0.2 : 0),
      casualtiesAbstract: "（抽象描述，仅用于叙事）",
      consequences: ["阵营势力变化","集体记忆累积","制度调整"],
      peaceTerms: t === "PEACE_TREATY" ? ["停战","互市","共建议会"] : undefined,
      memoryImpact: 0.6,
      fictionDisclaimer: WAR_PEACE_FICTION_NOTE,
    });
  }
  return records;
}
