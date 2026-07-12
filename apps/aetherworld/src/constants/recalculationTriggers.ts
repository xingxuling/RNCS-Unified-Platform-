// 总重新计算触发条件 · Recalculation Triggers

export type RecalculationTriggerId =
  | "SUBJECT_CHANGED"
  | "SUBJECT_MODE_CHANGED"
  | "SEQUENCE_UPDATED"
  | "FULL_60_UPDATED"
  | "FEEDBACK_SUBMITTED"
  | "FEEDBACK_UPDATED"
  | "FEEDBACK_DELETED"
  | "REGION_CHANGED"
  | "PROMPT_HISTORY_UPDATED"
  | "SUBJECT_DELETED"
  | "DEMO_RESET"
  | "STORAGE_IMPORTED"
  | "STORAGE_CLEARED"
  | "VERSION_STATUS_CHANGED"
  | "QA_SCAN_COMPLETED"
  | "ACCURACY_STATS_UPDATED"
  | "BETA_STATUS_UPDATED"
  | "DOCS_UPDATED"
  | "MANUAL";

export interface RecalculationTriggerMeta {
  id: RecalculationTriggerId;
  cn: string;
  en: string;
  description: string;
  /** 默认建议范围 id（来自 recalculationScopes） */
  defaultScope:
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
  /** 是否高风险（删除主体、清空存储），需用户确认 */
  requiresConfirmation: boolean;
}

export const RECALCULATION_TRIGGERS: Record<RecalculationTriggerId, RecalculationTriggerMeta> = {
  SUBJECT_CHANGED:        { id: "SUBJECT_CHANGED",        cn: "切换主体",         en: "Subject Changed",         description: "用户切换当前主体。",                       defaultScope: "CURRENT_SUBJECT_ONLY", requiresConfirmation: false },
  SUBJECT_MODE_CHANGED:   { id: "SUBJECT_MODE_CHANGED",   cn: "主体模式切换",     en: "Subject Mode Changed",    description: "Demo / Light 20 / Full 60 / Imported 切换。", defaultScope: "CURRENT_SUBJECT_ONLY", requiresConfirmation: false },
  SEQUENCE_UPDATED:       { id: "SEQUENCE_UPDATED",       cn: "数列修改",         en: "Sequence Updated",        description: "用户修改 20 组数列。",                     defaultScope: "CURRENT_SUBJECT_ONLY", requiresConfirmation: false },
  FULL_60_UPDATED:        { id: "FULL_60_UPDATED",        cn: "60 组数列修改",    en: "Full 60 Updated",         description: "用户修改完整 60 组数列。",                 defaultScope: "CURRENT_SUBJECT_ONLY", requiresConfirmation: true  },
  FEEDBACK_SUBMITTED:     { id: "FEEDBACK_SUBMITTED",     cn: "提交新回验",       en: "Feedback Submitted",      description: "新增一条回验记录。",                       defaultScope: "FEEDBACK_WEIGHTS_ONLY", requiresConfirmation: false },
  FEEDBACK_UPDATED:       { id: "FEEDBACK_UPDATED",       cn: "修改回验",         en: "Feedback Updated",        description: "用户编辑旧回验。",                         defaultScope: "FEEDBACK_WEIGHTS_ONLY", requiresConfirmation: false },
  FEEDBACK_DELETED:       { id: "FEEDBACK_DELETED",       cn: "删除回验",         en: "Feedback Deleted",        description: "用户删除一条回验。",                       defaultScope: "FEEDBACK_WEIGHTS_ONLY", requiresConfirmation: false },
  REGION_CHANGED:         { id: "REGION_CHANGED",         cn: "切换地区",         en: "Region Changed",          description: "用户切换地区用户模型。",                   defaultScope: "REGIONAL_UX_ONLY", requiresConfirmation: false },
  PROMPT_HISTORY_UPDATED: { id: "PROMPT_HISTORY_UPDATED", cn: "Prompt 历史变化",  en: "Prompt History Updated",  description: "Prompt Forge 历史发生变化。",              defaultScope: "PROMPT_FORGE_ONLY", requiresConfirmation: false },
  SUBJECT_DELETED:        { id: "SUBJECT_DELETED",        cn: "删除真实主体",     en: "Subject Deleted",         description: "用户删除真实主体。",                       defaultScope: "ALL_SUBJECTS", requiresConfirmation: true },
  DEMO_RESET:             { id: "DEMO_RESET",             cn: "Demo 重置",        en: "Demo Reset",              description: "Demo Persona 已重置。",                    defaultScope: "DEMO_ONLY", requiresConfirmation: false },
  STORAGE_IMPORTED:       { id: "STORAGE_IMPORTED",       cn: "导入数据",         en: "Storage Imported",        description: "用户导入数据。",                           defaultScope: "FULL_SYSTEM", requiresConfirmation: true },
  STORAGE_CLEARED:        { id: "STORAGE_CLEARED",        cn: "清空数据",         en: "Storage Cleared",         description: "用户清空所有数据。",                       defaultScope: "FULL_SYSTEM", requiresConfirmation: true },
  VERSION_STATUS_CHANGED: { id: "VERSION_STATUS_CHANGED", cn: "版本状态变化",     en: "Version Status Changed",  description: "版本迭代状态变化。",                       defaultScope: "QA_ONLY", requiresConfirmation: false },
  QA_SCAN_COMPLETED:      { id: "QA_SCAN_COMPLETED",      cn: "QA 扫描完成",      en: "QA Scan Completed",       description: "软件测试反馈扫描完成。",                   defaultScope: "QA_ONLY", requiresConfirmation: false },
  ACCURACY_STATS_UPDATED: { id: "ACCURACY_STATS_UPDATED", cn: "准确率统计更新",   en: "Accuracy Stats Updated",  description: "准确率统计发生变化。",                     defaultScope: "FEEDBACK_WEIGHTS_ONLY", requiresConfirmation: false },
  BETA_STATUS_UPDATED:    { id: "BETA_STATUS_UPDATED",    cn: "内测状态变化",     en: "Beta Status Updated",     description: "内测发布状态变化。",                       defaultScope: "QA_ONLY", requiresConfirmation: false },
  DOCS_UPDATED:           { id: "DOCS_UPDATED",           cn: "产品文档更新",     en: "Docs Updated",            description: "产品文档更新。",                           defaultScope: "QA_ONLY", requiresConfirmation: false },
  MANUAL:                 { id: "MANUAL",                 cn: "手动触发",         en: "Manual",                  description: "用户在重算中心手动触发。",                 defaultScope: "FULL_SYSTEM", requiresConfirmation: false },
};
