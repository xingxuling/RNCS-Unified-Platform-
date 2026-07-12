import { CONFLICT_TYPES, type ConflictTypeId } from "@/constants/narrative/conflictTypes";

export interface ConflictResult {
  mainConflict: string;
  surfaceConflict: string;
  hiddenConflict: string;
  pressureLevel: number;
  escalationPath: string[];
  resolutionOptions: string[];
  conflictType: ConflictTypeId;
}

export function buildConflict(input: {
  premise: string;
  conflictType?: ConflictTypeId;
  intensity?: number;
}): ConflictResult {
  const type = (input.conflictType ?? "HUMAN_VS_ROLE") as ConflictTypeId;
  const pressure = Math.max(0, Math.min(1, input.intensity ?? 0.6));
  return {
    conflictType: type,
    mainConflict: `${CONFLICT_TYPES.find(c => c.id === type)?.name}：${input.premise}`,
    surfaceConflict: "一场表面上的争论 / 任务 / 选择",
    hiddenConflict: "双方都不愿承认的真实分歧",
    pressureLevel: pressure,
    escalationPath: ["误会","推迟","代价显现","必须选择","行动落地"],
    resolutionOptions: ["承担代价行动","延迟换条件","结构性重订关系","退出但保留尊严"],
  };
}

export { CONFLICT_TYPES };
