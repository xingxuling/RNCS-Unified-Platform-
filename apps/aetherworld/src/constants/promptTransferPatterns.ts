// 抽象迁移模式 · Prompt Transfer Patterns
export interface TransferPattern {
  id: string;
  name: string;        // 中文
  en: string;
  sourceDomain: string;
  targetDomain: string;
  abstractionSteps: string[];
  requiredVariables: string[];
  outputPromptType: string; // template family key suggestion
  riskWarnings: string[];
}

export const PROMPT_TRANSFER_PATTERNS: TransferPattern[] = [
  {
    id: "product_to_documentation",
    name: "产品 → 文档", en: "Product → Documentation",
    sourceDomain: "product_design", targetDomain: "documentation",
    abstractionSteps: ["抽取模块清单","抽取术语","抽取边界","映射为章节"],
    requiredVariables: ["productName","existingModules","languageLevel"],
    outputPromptType: "FOUNDATION",
    riskWarnings: ["术语密度过高","章节遗漏"],
  },
  {
    id: "product_to_ux",
    name: "产品 → 用户体验", en: "Product → UX",
    sourceDomain: "product_design", targetDomain: "ux_ui",
    abstractionSteps: ["抽取核心任务","抽取角色","映射为路径"],
    requiredVariables: ["targetUser","region","languageLevel"],
    outputPromptType: "UX_USER_FACING",
    riskWarnings: ["路径割裂","认知过载"],
  },
  {
    id: "product_to_qa",
    name: "产品 → 测试", en: "Product → QA",
    sourceDomain: "product_design", targetDomain: "qa_testing",
    abstractionSteps: ["抽取模块","映射期望集成","形成测试矩阵"],
    requiredVariables: ["existingModules","acceptanceCriteria"],
    outputPromptType: "VALIDATION_FEEDBACK",
    riskWarnings: ["漏测","误报"],
  },
  {
    id: "product_to_launch",
    name: "产品 → 发布", en: "Product → Launch",
    sourceDomain: "product_design", targetDomain: "startup_planning",
    abstractionSteps: ["抽取成熟度","抽取风险","映射为门槛"],
    requiredVariables: ["currentVersion","betaStatus"],
    outputPromptType: "STRATEGY",
    riskWarnings: ["过早发布"],
  },
  {
    id: "prediction_to_product",
    name: "预测 → 产品", en: "Prediction → Product",
    sourceDomain: "prediction_forecast", targetDomain: "product_design",
    abstractionSteps: ["抽取维度","映射为功能","形成模块"],
    requiredVariables: ["goal","desiredOutput"],
    outputPromptType: "FOUNDATION",
    riskWarnings: ["越界为绝对预测"],
  },
  {
    id: "cognition_to_product",
    name: "个人认知 → 产品系统", en: "Personal Cognition → Product System",
    sourceDomain: "personal_os", targetDomain: "product_design",
    abstractionSteps: ["抽取节奏","抽取模块","映射为系统"],
    requiredVariables: ["productName","targetUser"],
    outputPromptType: "FOUNDATION",
    riskWarnings: ["仅适配作者本人"],
  },
  {
    id: "worldbuilding_to_architecture",
    name: "世界观 → 系统架构", en: "Fiction Worldbuilding → Product Architecture",
    sourceDomain: "worldbuilding", targetDomain: "system_architecture",
    abstractionSteps: ["抽取派系 / 规则","映射为服务","映射为边界"],
    requiredVariables: ["constraints","doNotBreak"],
    outputPromptType: "FOUNDATION",
    riskWarnings: ["过度比喻"],
  },
  {
    id: "business_to_prompt",
    name: "商业判断 → 提示词模板", en: "Business Strategy → Prompt Template",
    sourceDomain: "business_strategy", targetDomain: "prompt_engineering",
    abstractionSteps: ["抽取假设","抽取约束","形成提示词骨架"],
    requiredVariables: ["goal","constraints"],
    outputPromptType: "STRATEGY",
    riskWarnings: ["缺数据"],
  },
  {
    id: "feedback_to_iteration",
    name: "用户回验 → 版本迭代", en: "User Feedback → Product Iteration",
    sourceDomain: "qa_testing", targetDomain: "software_dev",
    abstractionSteps: ["归类反馈","映射模块","形成补丁清单"],
    requiredVariables: ["currentVersion","existingModules"],
    outputPromptType: "EXPANSION",
    riskWarnings: ["碎片化"],
  },
  {
    id: "region_to_copy",
    name: "地区画像 → 文案", en: "Region Profile → Copywriting",
    sourceDomain: "localization", targetDomain: "copywriting",
    abstractionSteps: ["抽取语境","抽取禁忌","映射为 Tone"],
    requiredVariables: ["region","languageLevel"],
    outputPromptType: "UX_USER_FACING",
    riskWarnings: ["失真","越界"],
  },
  {
    id: "qa_to_fix_prompt",
    name: "QA 问题 → 修复提示词", en: "QA Issue → Fix Prompt",
    sourceDomain: "qa_testing", targetDomain: "software_dev",
    abstractionSteps: ["抽取问题","定位文件","形成最小修复"],
    requiredVariables: ["problem","doNotBreak"],
    outputPromptType: "DEBUG_REPAIR",
    riskWarnings: ["扩大改动"],
  },
  {
    id: "event_to_action",
    name: "事件预测 → 行动提示词", en: "Event Prediction → Action Prompt",
    sourceDomain: "prediction_forecast", targetDomain: "personal_productivity",
    abstractionSteps: ["抽取事件阶段","映射为可执行行动"],
    requiredVariables: ["goal","desiredOutput"],
    outputPromptType: "EXPANSION",
    riskWarnings: ["越界给绝对建议"],
  },
];

export function findPattern(id: string) {
  return PROMPT_TRANSFER_PATTERNS.find((p) => p.id === id);
}
