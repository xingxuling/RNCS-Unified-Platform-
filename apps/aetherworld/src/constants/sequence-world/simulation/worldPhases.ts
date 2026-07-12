export const WORLD_PHASES = [
  { id: "VOID",          label: "归零",       digitBias: ["0"] },
  { id: "SEED",          label: "种子",       digitBias: ["1"] },
  { id: "AWAKENING",     label: "觉醒",       digitBias: ["1", "2"] },
  { id: "EXPANSION",     label: "扩张",       digitBias: ["3", "4", "5"] },
  { id: "CONFLICT",      label: "冲突",       digitBias: ["5"] },
  { id: "STABILIZATION", label: "稳定",       digitBias: ["6"] },
  { id: "ARCHIVE",       label: "归档",       digitBias: ["0", "8"] },
  { id: "RESEED",        label: "再种子",     digitBias: ["1"] },
  { id: "TERMINAL",      label: "终局",       digitBias: ["9"] },
  { id: "OVERLOAD",      label: "过载",       digitBias: [] },
] as const;

export type WorldPhaseId = typeof WORLD_PHASES[number]["id"];

export interface WorldStateTransition {
  from: WorldPhaseId;
  to: WorldPhaseId;
  trigger: string;
  requiredDigits?: string[];
  risk?: string;
}

export const DEFAULT_TRANSITIONS: WorldStateTransition[] = [
  { from: "VOID",          to: "SEED",          trigger: "出现 1（开始）",         requiredDigits: ["1"] },
  { from: "SEED",          to: "AWAKENING",     trigger: "首次互动 / 2 出现",      requiredDigits: ["2"] },
  { from: "AWAKENING",     to: "EXPANSION",     trigger: "5 推动事件",             requiredDigits: ["5"] },
  { from: "EXPANSION",     to: "CONFLICT",      trigger: "事件压力上升",            requiredDigits: ["5"] },
  { from: "CONFLICT",      to: "STABILIZATION", trigger: "6 主导，承载恢复",       requiredDigits: ["6"] },
  { from: "STABILIZATION", to: "ARCHIVE",       trigger: "8/0 主导，归档收束",     requiredDigits: ["0", "8"] },
  { from: "ARCHIVE",       to: "RESEED",        trigger: "1 重新出现",             requiredDigits: ["1"] },
  { from: "RESEED",        to: "SEED",          trigger: "新循环",                  requiredDigits: ["1"] },
  { from: "EXPANSION",     to: "TERMINAL",      trigger: "9 主导，文明事件",       requiredDigits: ["9"] },
  { from: "EXPANSION",     to: "OVERLOAD",      trigger: "复杂度超载",             risk: "建议压缩输出或归档" },
  { from: "CONFLICT",      to: "OVERLOAD",      trigger: "事件队列堆积",           risk: "建议归档" },
];
