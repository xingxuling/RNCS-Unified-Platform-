import type { SequenceAIIntentId } from "./sequenceAIIntents";

export interface SequenceAIToolPolicy {
  engineId: string;
  allowedIntents: SequenceAIIntentId[];
  requiredMode: "ANY" | "REAL" | "FOUNDER";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  canExport: boolean;
  canWrite: boolean;
  userVisibleName: string;
  purpose: string;
  route?: string;
}

export const SEQUENCE_AI_TOOL_POLICIES: SequenceAIToolPolicy[] = [
  { engineId: "omniCalculus",         userVisibleName: "Omni 全域计算", purpose: "底层调度模型。", allowedIntents: ["ASK_DECISION","ANALYZE_OBJECT","SOLVE_PROBLEM"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: false, route: "/omni" },
  { engineId: "thingItselfCalculus",  userVisibleName: "万物本身计算法", purpose: "看清对象本体结构。", allowedIntents: ["ANALYZE_OBJECT","EXPLAIN_TERM"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: false, route: "/thing-itself" },
  { engineId: "universalBreakthrough",userVisibleName: "万物破解计算法", purpose: "决策与卡点破解。", allowedIntents: ["ASK_DECISION","SOLVE_PROBLEM"], requiredMode: "ANY", riskLevel: "MEDIUM", canExport: true, canWrite: false, route: "/universal-breakthrough" },
  { engineId: "virtualLife",          userVisibleName: "虚拟生活", purpose: "生成虚拟生活与日记。", allowedIntents: ["GENERATE_VIRTUAL_LIFE"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: true, route: "/virtual-life" },
  { engineId: "virtualCreation",      userVisibleName: "虚拟创造物", purpose: "虚拟创造物模拟。", allowedIntents: ["GENERATE_MODEL","GENERATE_WORLD"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: true, route: "/virtual-creation" },
  { engineId: "msl",                  userVisibleName: "母体数列语言 MSL", purpose: "五域数列解释与编译。", allowedIntents: ["ANALYZE_OBJECT","EXPLAIN_TERM","GENERATE_MODEL"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: false, route: "/mother-sequence-language" },
  { engineId: "sequenceWorldEngine",  userVisibleName: "数列世界引擎", purpose: "区域/NPC/任务生成与导出。", allowedIntents: ["GENERATE_WORLD","EXPORT_ENGINE_DATA"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: true, route: "/world-engine" },
  { engineId: "modelGeneration",      userVisibleName: "模型生成引擎", purpose: "Schema/模型/接口生成。", allowedIntents: ["GENERATE_MODEL","EXPORT_ENGINE_DATA"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: true, route: "/model-generation" },
  { engineId: "narrativeTextEngine",  userVisibleName: "剧情文本引擎", purpose: "剧情/小说/漫画/任务文本。", allowedIntents: ["GENERATE_NARRATIVE"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: true, route: "/narrative-engine" },
  { engineId: "vocalEngine",          userVisibleName: "声乐引擎", purpose: "声线/AI 音乐提示词。", allowedIntents: ["GENERATE_VOCAL"], requiredMode: "ANY", riskLevel: "MEDIUM", canExport: true, canWrite: true, route: "/vocal-engine" },
  { engineId: "translationEngine",    userVisibleName: "语言翻译引擎", purpose: "多语言本地化。", allowedIntents: ["TRANSLATE_LOCALIZE"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: false, route: "/translation-engine" },
  { engineId: "promptForge",          userVisibleName: "Prompt Forge", purpose: "可复制提示词生成。", allowedIntents: ["GENERATE_PROMPT"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: false, route: "/abstract-prompt-forge" },
  { engineId: "codeGeneration",       userVisibleName: "代码生成", purpose: "实现计划/骨架。", allowedIntents: ["GENERATE_CODE_PLAN"], requiredMode: "ANY", riskLevel: "MEDIUM", canExport: true, canWrite: false, route: "/code-generator" },
  { engineId: "copywritingGeneration",userVisibleName: "文案生成", purpose: "营销/产品文案。", allowedIntents: ["GENERATE_PROMPT"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: false, route: "/copy-generator" },
  { engineId: "productEncyclopedia",  userVisibleName: "产品百科", purpose: "术语与条目查询。", allowedIntents: ["EXPLAIN_TERM"], requiredMode: "ANY", riskLevel: "LOW", canExport: false, canWrite: false, route: "/encyclopedia" },
  { engineId: "usageExamples",        userVisibleName: "使用示例库", purpose: "示例引导。", allowedIntents: ["UNKNOWN","EXPLAIN_TERM"], requiredMode: "ANY", riskLevel: "LOW", canExport: false, canWrite: false, route: "/usage-examples" },
  { engineId: "softwareQA",           userVisibleName: "Software QA", purpose: "系统 Bug 与一致性。", allowedIntents: ["RUN_QA"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: false, route: "/system-audit" },
  { engineId: "recalculation",        userVisibleName: "重算系统", purpose: "标记 stale 并重算。", allowedIntents: ["RECALCULATE"], requiredMode: "ANY", riskLevel: "LOW", canExport: false, canWrite: true, route: "/recalculation" },
  { engineId: "systemIntegrationAudit", userVisibleName: "总集成审计", purpose: "连通性验收。", allowedIntents: ["RUN_QA"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: false, route: "/integration-audit" },
  { engineId: "safetyBoundary",       userVisibleName: "安全边界", purpose: "高风险过滤。", allowedIntents: ["ASK_DECISION","SOLVE_PROBLEM","GENERATE_VOCAL"], requiredMode: "ANY", riskLevel: "HIGH", canExport: false, canWrite: false, route: "/usage-safety" },
  { engineId: "founderConsole",       userVisibleName: "创始人控制台", purpose: "权限/引擎注册/标准。", allowedIntents: ["FOUNDER_SYSTEM_TASK"], requiredMode: "FOUNDER", riskLevel: "HIGH", canExport: true, canWrite: true, route: "/founder-console" },
  { engineId: "engineExport",         userVisibleName: "引擎导出", purpose: "JSON/Unity/Godot 导出。", allowedIntents: ["EXPORT_ENGINE_DATA"], requiredMode: "ANY", riskLevel: "LOW", canExport: true, canWrite: false, route: "/engine-export" },
];
