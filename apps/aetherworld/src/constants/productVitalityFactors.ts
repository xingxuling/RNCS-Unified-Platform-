export type VitalityFactorKey =
  | "pain" | "frequency" | "loop" | "data" | "identity"
  | "monetization" | "spread" | "depth" | "geoFit" | "ops";

export interface VitalityFactor {
  key: VitalityFactorKey;
  name: string;
  en: string;
  isCost?: boolean;
}

export const VITALITY_FACTORS: VitalityFactor[] = [
  { key: "pain",         name: "痛点强度", en: "Pain Intensity" },
  { key: "frequency",    name: "使用频率", en: "Frequency" },
  { key: "loop",         name: "反馈闭环", en: "Feedback Loop" },
  { key: "data",         name: "数据沉淀", en: "Data Accumulation" },
  { key: "identity",     name: "身份绑定", en: "Identity Attachment" },
  { key: "monetization", name: "变现潜力", en: "Monetization" },
  { key: "spread",       name: "传播性",   en: "Network Spread" },
  { key: "depth",        name: "系统深度", en: "System Depth" },
  { key: "geoFit",       name: "地理适配", en: "Geographic Fit" },
  { key: "ops",          name: "运营负担", en: "Operational Load", isCost: true },
];

export type VitalityLevel = "Dormant" | "Weak" | "Growing" | "Active" | "High-Vitality";
export const VITALITY_LABEL: Record<VitalityLevel, string> = {
  Dormant:         "蛰伏 · 暂无活性",
  Weak:            "弱 · 需补关键变量",
  Growing:         "成长中",
  Active:          "活跃",
  "High-Vitality": "高活性",
};
