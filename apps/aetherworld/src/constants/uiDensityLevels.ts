// UI 密度等级
export type UIDensityLevel = "LOW" | "MEDIUM" | "HIGH" | "EXPERT";

export interface UIDensityDef {
  id: UIDensityLevel;
  cn: string;
  en: string;
  description: string;
  shows: string[];
  weight: number; // 信息密度权重
}

export const UI_DENSITY: Record<UIDensityLevel, UIDensityDef> = {
  LOW: {
    id: "LOW",
    cn: "轻量",
    en: "Low",
    description: "适合新用户和手机端",
    shows: ["今日定数", "今日行动许可", "触发日历摘要", "回验入口", "安全提示"],
    weight: 1,
  },
  MEDIUM: {
    id: "MEDIUM",
    cn: "标准",
    en: "Medium",
    description: "适合普通桌面用户",
    shows: ["Dashboard", "Trigger Calendar", "Prediction Detail", "Feedback Center", "Product Docs"],
    weight: 2,
  },
  HIGH: {
    id: "HIGH",
    cn: "高密度",
    en: "High",
    description: "适合内测用户和创作者",
    shows: ["Prompt Forge", "Product Vitality", "Geo Analysis", "Regional UX", "Beta Launch"],
    weight: 3,
  },
  EXPERT: {
    id: "EXPERT",
    cn: "专家",
    en: "Expert",
    description: "适合创始人、研究用户、高阶用户",
    shows: ["Advanced Core", "Full 60", "Feedback Weight", "Software QA", "Recalculation", "Version Iteration", "All Calculus Docs"],
    weight: 4,
  },
};

export const DENSITY_ORDER: UIDensityLevel[] = ["LOW", "MEDIUM", "HIGH", "EXPERT"];

export function densityIndex(d: UIDensityLevel): number {
  return DENSITY_ORDER.indexOf(d);
}
