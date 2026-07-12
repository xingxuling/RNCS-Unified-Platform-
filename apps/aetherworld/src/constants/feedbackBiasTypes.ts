// 回验偏差类型定义
export type FeedbackBiasType =
  | "TIME_EARLY"
  | "TIME_DELAYED"
  | "EVENT_TYPE_DRIFT"
  | "SIGNAL_NOISE"
  | "ACTION_CHANGED_OUTCOME"
  | "FIELD_NOT_READY"
  | "HUMAN_VARIABLE_MISSING"
  | "OVER_PREDICTED"
  | "UNDER_PREDICTED"
  | "REVERSE_SIGNAL"
  | "REGION_MISFIT"
  | "PROMPT_SCOPE_DRIFT"
  | "PRODUCT_VITALITY_MISREAD";

export interface BiasMeta {
  key: FeedbackBiasType;
  label: string;
  en: string;
  desc: string;
  /** 受影响的引擎键 */
  affects: string[];
  /** 调整方向 (相对默认权重的 delta，单位百分点) */
  adjustments: Record<string, number>;
}

export const FEEDBACK_BIAS_TYPES: Record<FeedbackBiasType, BiasMeta> = {
  TIME_EARLY: {
    key: "TIME_EARLY",
    label: "时间提前",
    en: "Time Early",
    desc: "预测事件提前发生，时间相位偏移。",
    affects: ["scatterTrigger"],
    adjustments: { scatterTrigger: -3 },
  },
  TIME_DELAYED: {
    key: "TIME_DELAYED",
    label: "时间延迟",
    en: "Time Delayed",
    desc: "预测事件延后发生。保留事件类型，降低单日精度。",
    affects: ["scatterTrigger"],
    adjustments: { scatterTrigger: -4 },
  },
  EVENT_TYPE_DRIFT: {
    key: "EVENT_TYPE_DRIFT",
    label: "事件类型漂移",
    en: "Event Type Drift",
    desc: "事件发生了，但事件类型与预测不同。",
    affects: ["domainFolding"],
    adjustments: { domainFolding: -4 },
  },
  SIGNAL_NOISE: {
    key: "SIGNAL_NOISE",
    label: "信号噪声",
    en: "Signal Noise",
    desc: "预测基于情绪 / 愿望 / 恐惧 / 噪声。",
    affects: ["signalPurification"],
    adjustments: { signalPurification: -5 },
  },
  ACTION_CHANGED_OUTCOME: {
    key: "ACTION_CHANGED_OUTCOME",
    label: "行动改写结果",
    en: "Action Changed Outcome",
    desc: "用户因为预测改变了行动，导致结果被改写。不惩罚预测。",
    affects: [],
    adjustments: {},
  },
  FIELD_NOT_READY: {
    key: "FIELD_NOT_READY",
    label: "场域未承载",
    en: "Field Not Ready",
    desc: "时间与信号存在，但物理 / 资源 / 制度未到位。",
    affects: ["geoFactor", "scatterTrigger"],
    adjustments: { geoFactor: +4, scatterTrigger: -2 },
  },
  HUMAN_VARIABLE_MISSING: {
    key: "HUMAN_VARIABLE_MISSING",
    label: "人物变量未到",
    en: "Human Variable Missing",
    desc: "关键人物未出现或未回应。",
    affects: ["resonanceLock"],
    adjustments: { resonanceLock: +4 },
  },
  OVER_PREDICTED: {
    key: "OVER_PREDICTED",
    label: "预测过强",
    en: "Over Predicted",
    desc: "实际强度弱于预测，触发表达过满。",
    affects: ["pressureRebound", "branchCollapse"],
    adjustments: { pressureRebound: -3, branchCollapse: -2 },
  },
  UNDER_PREDICTED: {
    key: "UNDER_PREDICTED",
    label: "预测过弱",
    en: "Under Predicted",
    desc: "实际强度强于预测，触发表达过保守。",
    affects: ["pressureRebound", "branchCollapse"],
    adjustments: { pressureRebound: +3, branchCollapse: +2 },
  },
  REVERSE_SIGNAL: {
    key: "REVERSE_SIGNAL",
    label: "反向信号",
    en: "Reverse Signal",
    desc: "预测方向与实际相反。",
    affects: ["signalPurification", "branchCollapse"],
    adjustments: { signalPurification: +3, branchCollapse: +3 },
  },
  REGION_MISFIT: {
    key: "REGION_MISFIT",
    label: "地区语境误配",
    en: "Region Misfit",
    desc: "地区文化 / 文案 / 路径影响理解或使用。",
    affects: ["regionalUX"],
    adjustments: { regionalUX: -4 },
  },
  PROMPT_SCOPE_DRIFT: {
    key: "PROMPT_SCOPE_DRIFT",
    label: "提示词范围漂移",
    en: "Prompt Scope Drift",
    desc: "提示词过宽 / 过窄 / 偏离目标。",
    affects: ["promptCalculus"],
    adjustments: { promptCalculus: -3 },
  },
  PRODUCT_VITALITY_MISREAD: {
    key: "PRODUCT_VITALITY_MISREAD",
    label: "产品活性误判",
    en: "Product Vitality Misread",
    desc: "产品真实反馈与活性评分不一致。",
    affects: ["productVitality"],
    adjustments: { productVitality: -4 },
  },
};

export const BIAS_LIST: BiasMeta[] = Object.values(FEEDBACK_BIAS_TYPES);
