// sequenceObjectRecalculationBridge.ts
export const SEQUENCE_OBJECT_RECALC_KEYS = [
  "Recalculate Sequence Object Type",
  "Recalculate Object Structure",
  "Recalculate Runtime Contract",
  "Recalculate Object Interfaces",
  "Recalculate Object Lifecycle",
  "Recalculate Object Permissions",
  "Recalculate Object QA",
  "Recalculate Object Cross-Functional Uses",
  "Recalculate Object Export Package",
] as const;

export interface SequenceObjectRecalcRequest {
  reason: string;
  keys: string[];
  triggeredAt: string;
}

export function buildObjectRecalcRequest(reason: string, keys: string[] = [...SEQUENCE_OBJECT_RECALC_KEYS]): SequenceObjectRecalcRequest {
  return { reason, keys, triggeredAt: new Date().toISOString() };
}

export function buildObjectTextStaleSignal() {
  return {
    triggerType: "ENGINE_ADDED" as const,
    affectedModuleIds: ["sequence-object-architecture"] as string[],
    reason: "Sequence Object Architecture Engine 已新增。",
  };
}
