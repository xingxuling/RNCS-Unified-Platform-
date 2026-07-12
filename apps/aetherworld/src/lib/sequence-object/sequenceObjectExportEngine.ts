// sequenceObjectExportEngine.ts
import type { SequenceObjectExportTarget } from "@/constants/sequence-object/sequenceObjectExportTargets";
import type { SequenceObjectPermissionLevel } from "@/constants/sequence-object/sequenceObjectPermissionLevels";

export interface SequenceObjectExportPackage {
  exportId: string;
  target: SequenceObjectExportTarget;
  metadata: Record<string, string>;
  payload: object;
  warnings: string[];
  blocked: boolean;
}

export interface ExportInput {
  objectId: string;
  target: SequenceObjectExportTarget;
  privacyLevel: SequenceObjectPermissionLevel;
  hasContract: boolean;
  hasQa: boolean;
  isCivilization: boolean;
  isFictional: boolean;
  payload: object;
}

export function exportObject(input: ExportInput): SequenceObjectExportPackage {
  const warnings: string[] = [];
  let blocked = false;

  if (input.privacyLevel === "SYSTEM_ONLY") { blocked = true; warnings.push("SYSTEM_ONLY 不可导出。"); }
  if (input.privacyLevel === "FOUNDER_PRIVATE") warnings.push("FOUNDER_PRIVATE：仅 Founder 可导出。");
  if (input.privacyLevel === "USER_PRIVATE") warnings.push("USER_PRIVATE：导出包含用户私密数据。");
  if (input.target === "RUNTIME_CONTRACT" && !input.hasContract) { blocked = true; warnings.push("缺少 Runtime Contract。"); }
  if (input.target === "ENGINE_SPEC" && !input.hasQa) warnings.push("Engine 导出建议附带 QA 报告。");
  if (input.isCivilization) warnings.push("Civilization 导出必须附带 Constitution Notes。");
  if (input.isFictional) warnings.push("FICTIONAL / INTERNAL：导出仅用于 Aetherworld 内部，不代表现实事实。");

  return {
    exportId: `exp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    target: input.target,
    metadata: {
      objectId: input.objectId,
      privacyLevel: input.privacyLevel,
      fictional: String(input.isFictional),
      civilization: String(input.isCivilization),
    },
    payload: input.payload,
    warnings,
    blocked,
  };
}
