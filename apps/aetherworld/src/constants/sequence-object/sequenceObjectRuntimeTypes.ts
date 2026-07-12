export const SEQUENCE_OBJECT_RUNTIME_TYPES = [
  "NONE","READ_ONLY","STATELESS","STATEFUL","EVENT_DRIVEN","WORKFLOW","SCHEDULED","GOVERNED",
] as const;
export type SequenceObjectRuntimeType = (typeof SEQUENCE_OBJECT_RUNTIME_TYPES)[number];

export const RUNTIME_TYPE_LABELS: Record<SequenceObjectRuntimeType, string> = {
  NONE: "无运行时", READ_ONLY: "只读", STATELESS: "无状态", STATEFUL: "有状态",
  EVENT_DRIVEN: "事件驱动", WORKFLOW: "工作流", SCHEDULED: "定时", GOVERNED: "受治理",
};
