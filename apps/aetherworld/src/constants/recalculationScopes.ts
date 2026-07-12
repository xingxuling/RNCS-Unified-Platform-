// 重算范围 · Recalculation Scopes

export type RecalculationScopeId =
  | "CURRENT_SUBJECT_ONLY"
  | "ALL_SUBJECTS"
  | "DEMO_ONLY"
  | "FEEDBACK_WEIGHTS_ONLY"
  | "CALENDAR_ONLY"
  | "DETERMINATION_ONLY"
  | "REGIONAL_UX_ONLY"
  | "PROMPT_FORGE_ONLY"
  | "QA_ONLY"
  | "FULL_SYSTEM";

/** 系统派生模块 ID — 用作依赖图与日志中的最小单元 */
export type RecalcModuleId =
  | "subject_derived"
  | "trigger_calendar"
  | "timeline"
  | "prediction_detail"
  | "determinant_number"
  | "feedback_weight"
  | "accuracy_metrics"
  | "regional_ux"
  | "prompt_forge"
  | "product_vitality"
  | "geo_factor"
  | "beta_launch"
  | "version_iteration"
  | "software_qa"
  | "safety_coverage"
  | "manual_guidance"
  | "isolation_state";

export interface RecalcModuleMeta {
  id: RecalcModuleId;
  cn: string;
  en: string;
  /** 该模块依赖的上游模块（变化会让此模块过期） */
  dependsOn: RecalcModuleId[];
  /** 该模块是否真实主体敏感（Demo/Real 隔离敏感） */
  subjectSensitive: boolean;
}

export const RECALC_MODULES: Record<RecalcModuleId, RecalcModuleMeta> = {
  subject_derived:    { id: "subject_derived",    cn: "主体派生状态",    en: "Subject Derived State",   dependsOn: [],                                                                                  subjectSensitive: true  },
  trigger_calendar:   { id: "trigger_calendar",   cn: "触发日历",        en: "Trigger Calendar",         dependsOn: ["subject_derived", "feedback_weight"],                                              subjectSensitive: true  },
  timeline:           { id: "timeline",           cn: "未来时间线",      en: "Timeline",                 dependsOn: ["subject_derived", "feedback_weight"],                                              subjectSensitive: true  },
  prediction_detail:  { id: "prediction_detail",  cn: "预测详情",        en: "Prediction Detail",        dependsOn: ["trigger_calendar", "determinant_number"],                                          subjectSensitive: true  },
  determinant_number: { id: "determinant_number", cn: "定数判断",        en: "Determinant Number",       dependsOn: ["subject_derived", "feedback_weight"],                                              subjectSensitive: true  },
  feedback_weight:    { id: "feedback_weight",    cn: "回验权重",        en: "Feedback Weight Engine",   dependsOn: ["subject_derived"],                                                                 subjectSensitive: true  },
  accuracy_metrics:   { id: "accuracy_metrics",   cn: "准确率指标",      en: "Accuracy Metrics",         dependsOn: ["feedback_weight"],                                                                 subjectSensitive: true  },
  regional_ux:        { id: "regional_ux",        cn: "地区用户体验",    en: "Regional UX",              dependsOn: [],                                                                                  subjectSensitive: false },
  prompt_forge:       { id: "prompt_forge",       cn: "Prompt Forge",    en: "Prompt Forge",             dependsOn: ["regional_ux", "feedback_weight"],                                                  subjectSensitive: false },
  product_vitality:   { id: "product_vitality",   cn: "产品活性",        en: "Product Vitality",         dependsOn: [],                                                                                  subjectSensitive: false },
  geo_factor:         { id: "geo_factor",         cn: "地理因素",        en: "Geo Factor",               dependsOn: ["regional_ux"],                                                                     subjectSensitive: false },
  beta_launch:        { id: "beta_launch",        cn: "内测发布",        en: "Beta Launch",              dependsOn: ["accuracy_metrics", "software_qa", "regional_ux", "isolation_state"],               subjectSensitive: false },
  version_iteration:  { id: "version_iteration",  cn: "版本迭代",        en: "Version Iteration",        dependsOn: ["beta_launch", "software_qa", "accuracy_metrics"],                                  subjectSensitive: false },
  software_qa:        { id: "software_qa",        cn: "软件 QA",         en: "Software QA",              dependsOn: ["safety_coverage", "isolation_state"],                                              subjectSensitive: false },
  safety_coverage:    { id: "safety_coverage",    cn: "安全边界覆盖",    en: "Safety Boundary Coverage", dependsOn: [],                                                                                  subjectSensitive: false },
  manual_guidance:    { id: "manual_guidance",    cn: "使用手册指引",    en: "Manual Guidance",          dependsOn: [],                                                                                  subjectSensitive: false },
  isolation_state:    { id: "isolation_state",    cn: "Demo / Real 隔离",en: "Demo / Real Isolation",    dependsOn: [],                                                                                  subjectSensitive: true  },
};

/** Scope → 受影响模块映射 */
export const SCOPE_MODULES: Record<RecalculationScopeId, RecalcModuleId[]> = {
  CURRENT_SUBJECT_ONLY:   ["subject_derived", "trigger_calendar", "timeline", "prediction_detail", "determinant_number", "feedback_weight"],
  ALL_SUBJECTS:           ["subject_derived", "trigger_calendar", "timeline", "prediction_detail", "determinant_number", "feedback_weight", "accuracy_metrics"],
  DEMO_ONLY:              ["subject_derived", "trigger_calendar", "timeline", "determinant_number"],
  FEEDBACK_WEIGHTS_ONLY:  ["feedback_weight", "determinant_number", "accuracy_metrics"],
  CALENDAR_ONLY:          ["trigger_calendar", "timeline"],
  DETERMINATION_ONLY:     ["determinant_number"],
  REGIONAL_UX_ONLY:       ["regional_ux", "prompt_forge", "geo_factor", "beta_launch"],
  PROMPT_FORGE_ONLY:      ["prompt_forge"],
  QA_ONLY:                ["software_qa", "safety_coverage", "manual_guidance", "beta_launch", "version_iteration"],
  FULL_SYSTEM:            Object.keys(RECALC_MODULES) as RecalcModuleId[],
};

export const SCOPE_META: Record<RecalculationScopeId, { cn: string; en: string; description: string }> = {
  CURRENT_SUBJECT_ONLY:  { cn: "仅当前主体",       en: "Current Subject",     description: "重算当前主体的派生状态、日历、定数与回验权重。" },
  ALL_SUBJECTS:          { cn: "全部真实主体",     en: "All Real Subjects",   description: "对所有真实主体逐一重算（保持 subjectId 隔离）。" },
  DEMO_ONLY:             { cn: "仅 Demo",          en: "Demo Only",           description: "只重算 Demo Persona，不触碰真实主体。" },
  FEEDBACK_WEIGHTS_ONLY: { cn: "仅回验权重",       en: "Feedback Weights",    description: "重算回验权重、定数与准确率。" },
  CALENDAR_ONLY:         { cn: "仅日历 / 时间线",  en: "Calendar & Timeline", description: "重算触发日历与未来时间线。" },
  DETERMINATION_ONLY:    { cn: "仅定数",           en: "Determination",       description: "重算定数状态。" },
  REGIONAL_UX_ONLY:      { cn: "仅地区体验",       en: "Regional UX",         description: "重算地区 UX、Prompt 推荐与内测准入。" },
  PROMPT_FORGE_ONLY:     { cn: "仅 Prompt Forge",  en: "Prompt Forge",        description: "重算 Prompt 类型权重与历史有效性。" },
  QA_ONLY:               { cn: "仅 QA / 版本",     en: "QA & Version",        description: "重算 QA Health、版本与内测就绪。" },
  FULL_SYSTEM:           { cn: "完整全系统",       en: "Full System",         description: "重算全部派生状态。耗时最长。" },
};
