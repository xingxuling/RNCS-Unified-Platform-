export type SignalTypeKey =
  | "true" | "emotional" | "wish" | "fear"
  | "delayed" | "false_sync" | "reverse" | "empty";

export interface SignalType {
  key: SignalTypeKey;
  name: string;
  en: string;
  desc: string;
  tone: "good" | "warn" | "bad" | "neutral";
}

export const SIGNAL_TYPES: SignalType[] = [
  { key: "true",       name: "真信号",   en: "True Signal",      desc: "结构性、跨域一致、可入模。", tone: "good" },
  { key: "emotional",  name: "情绪噪声", en: "Emotional Noise",  desc: "情绪放大产生的假强度。",     tone: "warn" },
  { key: "wish",       name: "愿望投射", en: "Wish Projection",  desc: "因渴望而生成的幻象。",       tone: "warn" },
  { key: "fear",       name: "恐惧投射", en: "Fear Projection",  desc: "因担心而高估的概率。",       tone: "warn" },
  { key: "delayed",    name: "延迟残影", en: "Delayed Echo",     desc: "旧事件的惯性回声。",         tone: "neutral" },
  { key: "false_sync", name: "伪同步",   en: "False Sync",       desc: "巧合多但无结构。",           tone: "neutral" },
  { key: "reverse",    name: "反向信号", en: "Reverse Signal",   desc: "表象与本质相反。",           tone: "bad" },
  { key: "empty",      name: "空信号",   en: "Empty Signal",     desc: "支撑不足，不进入模型。",     tone: "bad" },
];

export const PERMISSION_LABEL = {
  YES: "允许入模",
  CAUTION: "谨慎入模",
  NO: "不入模",
} as const;
export type ModelPermission = keyof typeof PERMISSION_LABEL;
