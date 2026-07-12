import type { RiskLevel } from "./founderPermissionLevels";

export interface RiskOperation {
  id: string;
  title: string;
  en: string;
  riskLevel: RiskLevel;
  scope: string;
  reversible: boolean;
  requireConfirmPhrase: string;
  description: string;
}

export const FOUNDER_RISK_OPERATIONS: RiskOperation[] = [
  { id: "CLEAR_LOCAL_STORAGE",   title: "清空所有本地数据",       en: "Clear All Local Storage",  riskLevel: "CRITICAL", scope: "全部本地数据",           reversible: false, requireConfirmPhrase: "CONFIRM CLEAR", description: "清空 localStorage 中全部数据，无法恢复。" },
  { id: "DELETE_REAL_SUBJECT",   title: "删除真实主体",           en: "Delete Real Subject",      riskLevel: "CRITICAL", scope: "Real Subject 主体数据", reversible: false, requireConfirmPhrase: "CONFIRM DELETE", description: "删除真实主体及其 Full 60 数据。" },
  { id: "DELETE_FULL60",         title: "删除 Full 60 数据",      en: "Delete Full 60 Data",      riskLevel: "CRITICAL", scope: "Full 60 深度数据",       reversible: false, requireConfirmPhrase: "CONFIRM DELETE", description: "删除真实主体的 60 维深度分析数据。" },
  { id: "RESET_FOUNDER_PASSWORD",title: "重置创始人口令",         en: "Reset Founder Password",   riskLevel: "CRITICAL", scope: "本地 Founder Gate",      reversible: false, requireConfirmPhrase: "RESET",          description: "清除本地创始人保护，需重新设置口令。" },
  { id: "FULL_SYSTEM_RECALC",    title: "执行全系统重算",         en: "Full System Recalculation",riskLevel: "CRITICAL", scope: "全主体 + 全事件",         reversible: true,  requireConfirmPhrase: "CONFIRM",        description: "对全部主体与事件重新计算，耗时较长。" },
  { id: "EVENT_BULK_MERGE",      title: "批量合并事件库",         en: "Event Library Bulk Merge", riskLevel: "CRITICAL", scope: "事件库",                  reversible: false, requireConfirmPhrase: "CONFIRM MERGE",  description: "对重复簇执行批量合并，旧 eventId 归并到主事件。" },
  { id: "MARK_V1_RELEASE",       title: "标记 v1.0 发布",         en: "Mark v1.0 Release",        riskLevel: "CRITICAL", scope: "版本状态",                reversible: true,  requireConfirmPhrase: "CONFIRM RELEASE",description: "切换版本状态为 v1.0 / Guided Beta / Public Waitlist。" },
  { id: "EXPORT_REAL_SUBJECT",   title: "导出真实主体数据",       en: "Export Real Subject Data", riskLevel: "CRITICAL", scope: "Real Subject 完整数据",   reversible: true,  requireConfirmPhrase: "CONFIRM EXPORT", description: "将真实主体数据导出为 JSON 文件。" },
  { id: "CLEAR_FEEDBACK_LOG",    title: "清空回验记录",           en: "Clear Feedback Log",       riskLevel: "CRITICAL", scope: "回验记录",                reversible: false, requireConfirmPhrase: "CONFIRM CLEAR",  description: "清空全部回验记录，影响权重训练。" },
  { id: "RESET_DEMO_REAL_ISOLATION", title: "重置 Demo/Real 隔离", en: "Reset Demo/Real Isolation", riskLevel: "CRITICAL", scope: "隔离状态",               reversible: false, requireConfirmPhrase: "CONFIRM RESET",  description: "清除 Demo/Real 隔离状态，需重新初始化。" },

  { id: "EVENT_BULK_COMPLETION", title: "运行事件库批量补全",     en: "Run Event Bulk Completion",riskLevel: "HIGH",     scope: "事件库",                  reversible: true,  requireConfirmPhrase: "CONFIRM",        description: "执行批量字段补齐与标准化。" },
  { id: "QA_FULL_AUDIT",         title: "运行 QA 全量巡检",       en: "Run QA Full Audit",        riskLevel: "HIGH",     scope: "全系统",                  reversible: true,  requireConfirmPhrase: "CONFIRM",        description: "对全系统执行 QA 巡检并生成报告。" },
  { id: "MODIFY_PERMISSION_MATRIX", title: "修改权限矩阵",        en: "Modify Permission Matrix", riskLevel: "HIGH",     scope: "Founder Permission",      reversible: true,  requireConfirmPhrase: "CONFIRM",        description: "修改模块的可见性与可执行权限。" },
  { id: "BULK_GENERATE_PROMPTS", title: "批量生成 Prompt 模板",   en: "Bulk Generate Prompts",    riskLevel: "HIGH",     scope: "Prompt Template",         reversible: true,  requireConfirmPhrase: "CONFIRM",        description: "批量生成 Lovable 施工提示词模板。" },
  { id: "MODIFY_PRODUCT_DOCS_CORE", title: "修改产品文档核心定义",en: "Modify Core Doc Definition",riskLevel: "HIGH",    scope: "产品文档核心",            reversible: true,  requireConfirmPhrase: "CONFIRM",        description: "修改章节与术语表核心定义。" },
  { id: "MODIFY_ACCURACY_CLAIM", title: "修改有效率文案",         en: "Modify Accuracy Claim",    riskLevel: "HIGH",     scope: "有效率说明",              reversible: true,  requireConfirmPhrase: "CONFIRM",        description: "修改对外展示的预测有效率文案。" },
];

export function findRiskOperation(id: string) {
  return FOUNDER_RISK_OPERATIONS.find((o) => o.id === id);
}
