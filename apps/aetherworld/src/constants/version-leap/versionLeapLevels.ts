export type VersionLeapLevel = "PATCH" | "MINOR" | "MAJOR" | "LEAP" | "GENERATION";

export interface LeapLevelMeta {
  id: VersionLeapLevel;
  label: string;
  min: number;
  max: number;
  description: string;
}

export const VERSION_LEAP_LEVELS: LeapLevelMeta[] = [
  { id: "PATCH",      label: "补丁",     min: 0.0,  max: 0.20, description: "小修复、文案微调、无结构变更。" },
  { id: "MINOR",      label: "小版本",   min: 0.21, max: 0.40, description: "新功能或小入口，不动核心架构。" },
  { id: "MAJOR",      label: "大版本",   min: 0.41, max: 0.65, description: "新增核心模块、引擎、路由系统等。" },
  { id: "LEAP",       label: "跃迁版本", min: 0.66, max: 0.85, description: "系统级引擎 / 常数 / 宪法 / 世界引擎升级。" },
  { id: "GENERATION", label: "代际版本", min: 0.86, max: 1.00, description: "产品定位与架构层级变化。" },
];

export function levelForScore(score: number): VersionLeapLevel {
  for (const lv of VERSION_LEAP_LEVELS) {
    if (score >= lv.min && score <= lv.max) return lv.id;
  }
  return score > 1 ? "GENERATION" : "PATCH";
}
