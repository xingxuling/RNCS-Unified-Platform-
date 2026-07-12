// UI Fit 评估因子定义
export interface UIFitFactor {
  id: string;
  cn: string;
  en: string;
  kind: "positive" | "negative";
  weight: number;
  description: string;
}

export const UI_FIT_FACTORS: UIFitFactor[] = [
  { id: "device_fit",            cn: "设备适配",        en: "Device Fit",            kind: "positive", weight: 1.2, description: "当前 UI 密度是否与设备承载力匹配" },
  { id: "role_fit",              cn: "角色适配",        en: "Role Fit",              kind: "positive", weight: 1.1, description: "当前可见模块是否符合该角色" },
  { id: "permission_fit",        cn: "权限适配",        en: "Permission Fit",        kind: "positive", weight: 1.0, description: "高敏感功能是否仅对授权角色开放" },
  { id: "cognitive_load_fit",    cn: "认知负载适配",    en: "Cognitive Load Fit",    kind: "positive", weight: 1.1, description: "信息密度是否在用户阶段可承受范围" },
  { id: "regional_ux_fit",       cn: "地区体验适配",    en: "Regional UX Fit",       kind: "positive", weight: 0.9, description: "是否匹配地区语境与信任路径" },
  { id: "feature_priority_fit",  cn: "功能优先级适配",  en: "Feature Priority Fit",  kind: "positive", weight: 1.0, description: "主 CTA 与默认首页是否对该用户最有用" },
  { id: "safety_visibility",     cn: "安全可见度",      en: "Safety Visibility",     kind: "positive", weight: 1.1, description: "高风险场景是否清晰显示安全边界" },
  { id: "feedback_accessibility",cn: "回验可达性",      en: "Feedback Accessibility",kind: "positive", weight: 1.1, description: "预测后是否容易找到回验入口" },
  { id: "navigation_clarity",    cn: "导航清晰度",      en: "Navigation Clarity",    kind: "positive", weight: 1.0, description: "侧栏是否聚焦，无信息迷路" },

  { id: "ui_overload",           cn: "UI 过载",         en: "UI Overload",           kind: "negative", weight: 1.2, description: "页面同时呈现过多重交互/矩阵" },
  { id: "feature_exposure_risk", cn: "功能暴露风险",    en: "Feature Exposure Risk", kind: "negative", weight: 1.2, description: "敏感或高级功能对不合适角色可见" },
  { id: "misleading_copy",       cn: "误导性文案",      en: "Misleading Copy",       kind: "negative", weight: 1.0, description: "包含绝对、命定、断言式表达" },
  { id: "interaction_friction",  cn: "操作摩擦",        en: "Interaction Friction",  kind: "negative", weight: 0.9, description: "完成关键路径所需点击/切换过多" },
];

export const FIT_LEVELS = [
  { min: 85, id: "EXCELLENT_FIT",   cn: "完美适配", tone: "emerald" },
  { min: 70, id: "GOOD_FIT",        cn: "良好适配", tone: "cyan" },
  { min: 50, id: "USABLE_WITH_RISK",cn: "可用但有风险", tone: "amber" },
  { min: 30, id: "NEEDS_REDESIGN",  cn: "需重设计", tone: "orange" },
  { min: 0,  id: "POOR_FIT",        cn: "不适配",  tone: "rose" },
] as const;

export type FitLevelId = typeof FIT_LEVELS[number]["id"];

export function getFitLevel(score: number) {
  return FIT_LEVELS.find(l => score >= l.min)!;
}
