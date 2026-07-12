// sequenceObjectPermissionGuard.ts
import type { SequenceObjectPermissionLevel } from "@/constants/sequence-object/sequenceObjectPermissionLevels";
import type { SequenceObjectLayer } from "@/constants/sequence-object/sequenceObjectLayers";
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";

export interface SequenceObjectPermission {
  accessLevel: SequenceObjectPermissionLevel;
  canEdit: boolean;
  canExport: boolean;
  canShare: boolean;
  canCrossUse: boolean;
  canBecomeRuntimeObject: boolean;
  canBecomePublic: boolean;
  permissionNotes: string[];
}

export interface PermissionInput {
  type: SequenceObjectType;
  layer: SequenceObjectLayer;
  source: "MOTHER_SEQUENCE" | "FULL60" | "LIGHT20" | "MSL" | "USER_INPUT" | "WORKSPACE" | "ENGINE_OUTPUT" | "DEMO";
  userMode?: "PUBLIC" | "ADVANCED" | "FOUNDER";
}

export function buildPermissions(input: PermissionInput): SequenceObjectPermission {
  const notes: string[] = [];
  let level: SequenceObjectPermissionLevel = "USER_PRIVATE";

  if (input.source === "DEMO") { level = "PUBLIC_DEMO"; notes.push("Demo 对象，不得写入 Real。"); }
  if (input.source === "FULL60") { level = "USER_PRIVATE"; notes.push("Full60 生成对象默认 USER_PRIVATE。"); }
  if (input.userMode === "FOUNDER") { level = "FOUNDER_PRIVATE"; notes.push("Founder 对象默认 FOUNDER_PRIVATE。"); }
  if (input.layer === "CIVILIZATION_LAYER") notes.push("文明层对象不可普通公开。");

  const isCurrency = /CURRENCY|FINANCIAL/.test(input.type);
  if (isCurrency) notes.push("数列货币对象必须保持 non-financial boundary。");

  return {
    accessLevel: level,
    canEdit: (level as SequenceObjectPermissionLevel) !== "SYSTEM_ONLY",
    canExport: (level as SequenceObjectPermissionLevel) !== "SYSTEM_ONLY",
    canShare: (level as SequenceObjectPermissionLevel) === "PUBLIC" || level === "PUBLIC_DEMO",
    canCrossUse: true,
    canBecomeRuntimeObject: input.layer === "RUNTIME_LAYER",
    canBecomePublic: input.layer !== "CIVILIZATION_LAYER" && level !== "FOUNDER_PRIVATE",
    permissionNotes: notes,
  };
}
