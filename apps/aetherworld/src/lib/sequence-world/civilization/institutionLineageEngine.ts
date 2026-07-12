// Institution Lineage Engine
import { INSTITUTION_LINEAGE_PATHS } from "@/constants/sequence-world/civilization/institutionLineageTypes";
import type { CivilizationEra } from "./eraTransitionEngine";

export interface InstitutionStage {
  stageId: string;
  name: string;
  eraId: string;
  purpose: string;
  authorityLevel: number;
  legitimacy: number;
  corruptionRisk: number;
  changeReason: string;
}

export interface InstitutionLineage {
  lineageId: string;
  originalInstitutionId: string;
  originalType: string;
  currentInstitutionId: string;
  stages: InstitutionStage[];
  reforms: string[];
  collapses: string[];
  legitimacyHistory: number[];
}

export function buildInstitutionLineages(input: {
  worldId: string;
  institutions: { institutionId: string; name: string; institutionType: string }[];
  eras: CivilizationEra[];
}): InstitutionLineage[] {
  return input.institutions.map((inst, idx) => {
    const path = INSTITUTION_LINEAGE_PATHS[inst.institutionType] ?? [inst.institutionType.toLowerCase()];
    const stages: InstitutionStage[] = [];
    const legitHist: number[] = [];
    path.forEach((p, i) => {
      const era = input.eras[Math.min(i, input.eras.length - 1)];
      const legit = +(0.7 - i * 0.05).toFixed(2);
      legitHist.push(legit);
      stages.push({
        stageId: `${input.worldId}-lineage-${idx}-${i}`,
        name: p,
        eraId: era?.eraId ?? "",
        purpose: `${inst.name} 在 ${era?.name ?? ""} 阶段的形态：${p}`,
        authorityLevel: +(0.5 + i * 0.08).toFixed(2),
        legitimacy: legit,
        corruptionRisk: +(0.1 + i * 0.05).toFixed(2),
        changeReason: i === 0 ? "原始建立" : "时代演化与制度调整",
      });
    });
    return {
      lineageId: `${input.worldId}-lineage-${idx}`,
      originalInstitutionId: inst.institutionId,
      originalType: inst.institutionType,
      currentInstitutionId: inst.institutionId,
      stages,
      reforms: stages.length > 1 ? [`在 ${stages[1].eraId} 完成首次改革`] : [],
      collapses: [],
      legitimacyHistory: legitHist,
    };
  });
}
