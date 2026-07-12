export type CollapseLayerKey =
  | "cosmic" | "geo" | "bio" | "physical" | "social" | "mainline";

export interface CollapseLayer {
  key: CollapseLayerKey;
  name: string;
  en: string;
  desc: string;
}

export const COLLAPSE_LAYERS: CollapseLayer[] = [
  { key: "cosmic",   name: "宇宙天文层", en: "Cosmic Layer",            desc: "节气、月相、太阳周期、昼夜节律。" },
  { key: "geo",      name: "地理大气层", en: "Geo-Atmospheric Layer",   desc: "地点、气候、空气、交通密度。" },
  { key: "bio",      name: "生物化学层", en: "Bio-Chemical Layer",      desc: "睡眠、运动、激素、营养、炎症。" },
  { key: "physical", name: "物理约束层", en: "Physical Constraint",     desc: "能量守恒、惯性、阈值、阻尼。" },
  { key: "social",   name: "人事行动层", en: "Social-Action Layer",     desc: "人、合作、行动、代价、噪声。" },
  { key: "mainline", name: "主线反馈层", en: "Mainline-Feedback Layer", desc: "主线合法性、现实闭环、连续回应。" },
];

export type BranchState =
  | "OPEN" | "NARROW" | "COMPETING" | "COLLAPSING" | "MANIFESTED" | "CLOSED";

export const BRANCH_STATE_LABEL: Record<BranchState, string> = {
  OPEN:       "开放 · 多种可能",
  NARROW:     "变窄 · 选项减少",
  COMPETING:  "竞争 · 多分支拉扯",
  COLLAPSING: "塌缩中 · 接近显化",
  MANIFESTED: "已显化",
  CLOSED:     "关闭 · 不再发生",
};
