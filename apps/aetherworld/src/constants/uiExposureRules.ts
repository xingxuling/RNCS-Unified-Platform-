// UI 暴露风险规则
import { MODULES } from "./clientProfiles";

export type ExposureLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ExposureRiskDef {
  id: string;
  cn: string;
  en: string;
  description: string;
  defaultLevel: ExposureLevel;
  affectedModules?: string[];
  recommendedFix: string;
}

export const EXPOSURE_RISKS: ExposureRiskDef[] = [
  {
    id: "advanced_overexposure",
    cn: "高级功能过早暴露",
    en: "Advanced Feature Overexposure",
    description: "新用户/Demo 用户能看到高级内核、QA、重算等",
    defaultLevel: "MEDIUM",
    affectedModules: [MODULES.ADVANCED_CORE, MODULES.SOFTWARE_QA, MODULES.RECALCULATION, MODULES.FEEDBACK_WEIGHTS],
    recommendedFix: "默认折叠或在升级后开放",
  },
  {
    id: "full60_privacy_overexposure",
    cn: "Full 60 隐私暴露",
    en: "Full 60 Privacy Overexposure",
    description: "Full 60 对不合适用户或不安全端开放编辑",
    defaultLevel: "HIGH",
    affectedModules: [MODULES.REAL_SUBJECT],
    recommendedFix: "首次使用强制确认；不允许在 Mobile Small 编辑",
  },
  {
    id: "mystic_language_exposure",
    cn: "命运化表达暴露",
    en: "Mystic Language Exposure",
    description: "企业 / 专业用户看到命运、占断、风域奇点等",
    defaultLevel: "HIGH",
    recommendedFix: "启用 Enterprise Safe Mode 替换词表",
  },
  {
    id: "missing_safety_context",
    cn: "缺少安全上下文",
    en: "Missing Safety Context",
    description: "高风险页面没有安全边界提示",
    defaultLevel: "HIGH",
    recommendedFix: "添加 SafetyBoundaryBanner",
  },
  {
    id: "feedback_path_hidden",
    cn: "回验入口隐藏",
    en: "Feedback Path Hidden",
    description: "预测后找不到回验入口",
    defaultLevel: "HIGH",
    recommendedFix: "在预测详情顶/底/卡片增加 FeedbackEntryCard",
  },
  {
    id: "navigation_overload",
    cn: "导航过载",
    en: "Navigation Overload",
    description: "侧栏项数 > 角色实际需要的 1.5×",
    defaultLevel: "MEDIUM",
    recommendedFix: "按角色折叠次要分组",
  },
  {
    id: "dense_matrix_on_mobile",
    cn: "移动端密集矩阵",
    en: "Dense Matrix On Mobile",
    description: "移动端直接渲染 7+ 列矩阵",
    defaultLevel: "HIGH",
    recommendedFix: "改为分段卡片或只读摘要",
  },
  {
    id: "demo_real_ambiguity",
    cn: "Demo / Real 不分",
    en: "Demo / Real Ambiguity",
    description: "页面没有 DemoRealIsolationBadge",
    defaultLevel: "HIGH",
    recommendedFix: "在主标题旁强制显示主体模式徽章",
  },
  {
    id: "prompt_forge_premature",
    cn: "提示词锻造过早暴露",
    en: "Prompt Forge Premature Exposure",
    description: "新用户/Demo 直接看到完整 Prompt Forge",
    defaultLevel: "MEDIUM",
    affectedModules: [MODULES.PROMPT_FORGE],
    recommendedFix: "对新用户只显示快速提示词生成",
  },
  {
    id: "docs_underexposure",
    cn: "文档入口过深",
    en: "Documentation Underexposure",
    description: "复杂功能没有内联文档入口",
    defaultLevel: "LOW",
    recommendedFix: "在复杂页面顶部加 ContextualManualHint",
  },
];

// 命运化关键词 → 企业安全模式替换词
export const ENTERPRISE_SAFE_LEXICON: Array<{ from: string; to: string }> = [
  { from: "命运",       to: "Scenario / 情境" },
  { from: "预测",       to: "Forecast / Risk Signal" },
  { from: "定数",       to: "Decision State" },
  { from: "风域奇点",   to: "Trigger Convergence" },
  { from: "主体数列",   to: "Signal Matrix" },
  { from: "回验",       to: "Review Loop" },
  { from: "行动许可",   to: "Action Permission" },
  { from: "分支塌缩",   to: "Scenario Collapse" },
  { from: "多计算法内核", to: "Decision Engine Core" },
  { from: "占断",       to: "Risk Assertion" },
];

// 误导性表达关键词（用于扫描）
export const MISLEADING_COPY_KEYWORDS = [
  "保证准确", "必然发生", "100% 准确", "绝对预测", "已验证 95%", "断言未来",
];
