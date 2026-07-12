// Reform Movement Engine
import { REFORM_LABELS, type ReformType } from "@/constants/sequence-world/civilization/reformTypes";

export interface ReformMovement {
  reformId: string;
  name: string;
  reformType: ReformType;
  reformLabel: string;
  leadingFigures: string[];
  targetInstitutions: string[];
  causes: string[];
  goals: string[];
  resistance: string[];
  outcome: string;
  longTermEffect: string[];
}

const DIGIT_REFORM: Record<string, ReformType> = {
  "4": "RULE_REFORM", "8": "ECONOMIC_REFORM", "9": "BELIEF_REFORM",
  "0": "MEMORY_REFORM", "3": "TECHNOLOGY_REFORM", "2": "SOCIAL_REFORM",
  "5": "WORLD_ENGINEERING_REFORM",
};

export function buildReforms(input: {
  worldId: string; sourceDigits?: string[]; maxReforms?: number;
}): ReformMovement[] {
  const d = input.sourceDigits ?? [];
  const set = new Set<ReformType>();
  d.forEach(x => { const r = DIGIT_REFORM[x]; if (r) set.add(r); });
  if (set.size === 0) set.add("SOCIAL_REFORM");
  const max = input.maxReforms ?? 6;
  return Array.from(set).slice(0, max).map((t, i) => ({
    reformId: `${input.worldId}-reform-${i}`,
    name: `${REFORM_LABELS[t]} 运动`,
    reformType: t,
    reformLabel: REFORM_LABELS[t],
    leadingFigures: [],
    targetInstitutions: [],
    causes: ["旧制度疲态","新世代呼声"],
    goals: [`推动 ${REFORM_LABELS[t]}`],
    resistance: ["既得利益","传统派"],
    outcome: i % 2 === 0 ? "部分成功，留下持续辩论" : "成功推行，进入新阶段",
    longTermEffect: ["制度演化","集体记忆更新"],
  }));
}
