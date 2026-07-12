export type WebLcmConceptType =
  | "INTENT_CONCEPT" | "OBJECT_CONCEPT" | "WORLD_CONCEPT" | "CHARACTER_CONCEPT"
  | "NARRATIVE_CONCEPT" | "VOCAL_CONCEPT" | "APP_CONCEPT" | "CODE_CONCEPT"
  | "ERROR_CONCEPT" | "PATCH_CONCEPT" | "CALCULUS_CONCEPT" | "CONSTANT_CONCEPT"
  | "SYSTEM_CONCEPT" | "AGENT_CONCEPT" | "WORKFLOW_CONCEPT" | "EMOTION_CONCEPT"
  | "STYLE_CONCEPT" | "RISK_CONCEPT" | "GOVERNANCE_CONCEPT" | "META_CONCEPT";

export interface WebLcmConceptTypeDef {
  id: WebLcmConceptType;
  title: string;
  description: string;
}

export const WEB_LCM_CONCEPT_TYPES: WebLcmConceptTypeDef[] = [
  { id: "INTENT_CONCEPT",     title: "意图概念",   description: "用户输入背后的意图。" },
  { id: "OBJECT_CONCEPT",     title: "对象概念",   description: "Sequence Object 概念化表征。" },
  { id: "WORLD_CONCEPT",      title: "世界概念",   description: "世界引擎产生的世界级概念。" },
  { id: "CHARACTER_CONCEPT",  title: "角色概念",   description: "NPC / 角色的核心概念。" },
  { id: "NARRATIVE_CONCEPT",  title: "叙事概念",   description: "剧情、冲突、动机的概念。" },
  { id: "VOCAL_CONCEPT",      title: "声乐概念",   description: "音乐、声线、曲风的概念。" },
  { id: "APP_CONCEPT",        title: "应用概念",   description: "App 项目的核心概念。" },
  { id: "CODE_CONCEPT",       title: "代码概念",   description: "代码结构、模块、组件概念。" },
  { id: "ERROR_CONCEPT",      title: "错误概念",   description: "Code Sandbox 错误日志的概念。" },
  { id: "PATCH_CONCEPT",      title: "补丁概念",   description: "修复建议、Patch 草案概念。" },
  { id: "CALCULUS_CONCEPT",   title: "计算法概念", description: "计算法宇宙条目的概念。" },
  { id: "CONSTANT_CONCEPT",   title: "常数概念",   description: "常数宇宙条目的概念。" },
  { id: "SYSTEM_CONCEPT",     title: "系统概念",   description: "Runtime / System Constitution 概念。" },
  { id: "AGENT_CONCEPT",      title: "Agent 概念", description: "Agent Binding 概念。" },
  { id: "WORKFLOW_CONCEPT",   title: "工作流概念", description: "跨功能工作流概念。" },
  { id: "EMOTION_CONCEPT",    title: "情绪概念",   description: "情绪状态概念。" },
  { id: "STYLE_CONCEPT",      title: "风格概念",   description: "美学 / 文风 / 音乐风格概念。" },
  { id: "RISK_CONCEPT",       title: "风险概念",   description: "潜在风险与缓解概念。" },
  { id: "GOVERNANCE_CONCEPT", title: "治理概念",   description: "宪法 / 治理规则概念。" },
  { id: "META_CONCEPT",       title: "元概念",     description: "概念之上的概念。" },
];
