// 定数状态常量
export type DeterminationStatus =
  | "UNDETERMINED"
  | "SEMI_DETERMINED"
  | "NEAR_DETERMINED"
  | "DETERMINED"
  | "REVERSE_DETERMINED"
  | "FALSE_DETERMINED";

export interface DeterminationStateMeta {
  key: DeterminationStatus;
  label: string;            // 中文短标签
  en: string;
  tone: "low" | "mid" | "high" | "peak" | "warn" | "bad";
  colorVar: string;         // CSS 变量
  desc: string;             // 短描述
  defaultAction: string;    // 默认行动建议
}

export const DETERMINATION_STATES: Record<DeterminationStatus, DeterminationStateMeta> = {
  UNDETERMINED: {
    key: "UNDETERMINED",
    label: "未定",
    en: "Undetermined",
    tone: "low",
    colorVar: "var(--trigger-low)",
    desc: "分支仍开放，关键变量未足。适合观察、补证、等待。",
    defaultAction: "观察 / 补证",
  },
  SEMI_DETERMINED: {
    key: "SEMI_DETERMINED",
    label: "半定",
    en: "Semi-Determined",
    tone: "mid",
    colorVar: "var(--trigger-mid)",
    desc: "主要方向已现，但关键变量未锁。适合小步推进、保留余地。",
    defaultAction: "守中带进",
  },
  NEAR_DETERMINED: {
    key: "NEAR_DETERMINED",
    label: "接近已定",
    en: "Near-Determined",
    tone: "high",
    colorVar: "var(--trigger-high)",
    desc: "多数变量已收束，少量待最终确认。可按结果筹划。",
    defaultAction: "稳步推进",
  },
  DETERMINED: {
    key: "DETERMINED",
    label: "已定",
    en: "Determined",
    tone: "peak",
    colorVar: "var(--trigger-peak)",
    desc: "结构已收束，可按定数行动。适合推进、发布、确认、执行。",
    defaultAction: "进 / 执行",
  },
  REVERSE_DETERMINED: {
    key: "REVERSE_DETERMINED",
    label: "反定",
    en: "Reverse-Determined",
    tone: "bad",
    colorVar: "var(--destructive)",
    desc: "表面成立，实际正走向相反结果。需要警惕、转向、止损。",
    defaultAction: "转 / 止损",
  },
  FALSE_DETERMINED: {
    key: "FALSE_DETERMINED",
    label: "假定",
    en: "False-Determined",
    tone: "warn",
    colorVar: "var(--destructive)",
    desc: "明确感由情绪 / 愿望 / 恐惧 / 伪同步构成。需要暂停判断、重新净化信号。",
    defaultAction: "断 / 净化信号",
  },
};

export const DETERMINATION_BANDS: { min: number; max: number; status: DeterminationStatus }[] = [
  { min: 0,  max: 29,  status: "UNDETERMINED" },
  { min: 30, max: 54,  status: "SEMI_DETERMINED" },
  { min: 55, max: 74,  status: "NEAR_DETERMINED" },
  { min: 75, max: 100, status: "DETERMINED" },
];
