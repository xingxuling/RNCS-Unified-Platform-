export const SEQUENCE_OBJECT_LIFECYCLE_PHASES = ["SEED","GROWTH","STABLE","TRANSITION","ARCHIVE","TERMINATED"] as const;
export type SequenceObjectLifecyclePhase = (typeof SEQUENCE_OBJECT_LIFECYCLE_PHASES)[number];

export const LIFECYCLE_PHASE_LABELS: Record<SequenceObjectLifecyclePhase, string> = {
  SEED: "种子", GROWTH: "生长", STABLE: "稳定", TRANSITION: "过渡", ARCHIVE: "归档", TERMINATED: "终止",
};

export const LIFECYCLE_PHASE_DESCRIPTIONS: Record<SequenceObjectLifecyclePhase, string> = {
  SEED: "新生成的对象，尚未被复用。",
  GROWTH: "已被保存到 Workspace，正在迭代。",
  STABLE: "被多次复用并通过 QA。",
  TRANSITION: "结构开始失控或目标变化，需要审计。",
  ARCHIVE: "不再对齐当前目标，建议封存。",
  TERMINATED: "反噬、失控或违规，已终止。",
};
