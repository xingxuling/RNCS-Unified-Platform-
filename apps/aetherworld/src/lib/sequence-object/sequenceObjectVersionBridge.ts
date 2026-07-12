// sequenceObjectVersionBridge.ts
export const SEQUENCE_OBJECT_VERSION_EVENTS = [
  "OBJECT_CREATED","OBJECT_COMPILED","OBJECT_RUNTIME_CONTRACT_ADDED","OBJECT_INTERFACE_ADDED",
  "OBJECT_WORKSPACE_SAVED","OBJECT_CROSS_USED","OBJECT_QA_FAILED","OBJECT_ARCHIVED","OBJECT_TERMINATED",
  "CIVILIZATION_OBJECT_CREATED","ENGINE_OBJECT_CREATED",
] as const;
export type SequenceObjectVersionEvent = (typeof SEQUENCE_OBJECT_VERSION_EVENTS)[number];

export interface SequenceObjectVersionRecord {
  recordId: string;
  event: SequenceObjectVersionEvent;
  objectId: string;
  summary: string;
  changeType: "ARCHITECTURE_ADDED" | "OBJECT_OS_LAYER_ADDED" | "ENGINE_UPDATE" | "OBJECT_LIFECYCLE";
  recommendedLevel: "PATCH" | "MINOR" | "MAJOR" | "LEAP";
  releaseType: string;
  createdAt: string;
}

export function buildObjectVersionRecord(event: SequenceObjectVersionEvent, objectId: string, summary: string): SequenceObjectVersionRecord {
  const isArch = event === "OBJECT_CREATED" || event === "CIVILIZATION_OBJECT_CREATED" || event === "ENGINE_OBJECT_CREATED";
  return {
    recordId: `verobj_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    event, objectId, summary,
    changeType: isArch ? "OBJECT_OS_LAYER_ADDED" : "OBJECT_LIFECYCLE",
    recommendedLevel: isArch ? "LEAP" : "MINOR",
    releaseType: "OS_OBJECT_LAYER_RELEASE",
    createdAt: new Date().toISOString(),
  };
}

export const ENGINE_VERSION_RECORD = buildObjectVersionRecord("OBJECT_CREATED", "engine:sequence-object-architecture", "新增 Sequence Object Architecture Engine — Aetherworld 升级为数列驱动的对象化操作系统。");
