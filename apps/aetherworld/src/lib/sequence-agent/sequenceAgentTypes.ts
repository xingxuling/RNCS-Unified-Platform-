// 数列 Agent 数据结构
// 不重建注册表：本类型由已有数字角色（digital-roles）适配而来。
export type SequenceAgentType =
  | "ARCHITECT"
  | "PRODUCT"
  | "CODE"
  | "QA"
  | "SECURITY"
  | "PREDICTION"
  | "MEMORY"
  | "WORLD"
  | "SOCIAL"
  | "SCHEDULER"
  | "ANALYTICS"
  | "CUSTOM";

export type PersonaSource =
  | "SEQUENCE_ROLE"
  | "DIGITAL_ROLE"
  | "LIGHT_SUBJECT"
  | "REAL_SUBJECT"
  | "MANUAL";

export type AgentAuthorityLevel = "LOW" | "MEDIUM" | "HIGH" | "FOUNDER_ONLY";
export type AgentSafetyLevel = "LOW" | "MEDIUM" | "HIGH";
export type AgentMemoryScope = "SHARED" | "PRIVATE" | "HYBRID";

export interface SequenceAgent {
  id: string;
  name: string;
  cnName: string;
  agentType: SequenceAgentType;
  personaSource: PersonaSource;
  /** 对应已有数字角色 ID，便于复用 */
  digitalRoleId?: string;
  description: string;
  domain: string[];
  allowedTools: string[];
  deniedTools: string[];
  memoryScope: AgentMemoryScope;
  modelProviderPreference?: string;
  promptContractId?: string;
  authorityLevel: AgentAuthorityLevel;
  safetyLevel: AgentSafetyLevel;
  enabled: boolean;
  createdAt: string;
}

export type AgentRunStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "BLOCKED";
export type AgentSafetyStatus = "PASS" | "WARN" | "BLOCK";

export interface SequenceAgentRun {
  id: string;
  agentId: string;
  taskId?: string;
  chatSessionId?: string;
  input: string;
  output: string;
  status: AgentRunStatus;
  usedModel?: string;
  usedTools: string[];
  memoryUnitIds: string[];
  currencyEventId?: string;
  mslFrameId?: string;
  qaStatus?: string;
  safetyStatus: AgentSafetyStatus;
  createdAt: string;
}

export type AgentCollabMode = "SINGLE_AGENT" | "PANEL_REVIEW" | "CHAIN_OF_AGENTS";

export interface AgentPanelResult {
  mode: AgentCollabMode;
  runs: SequenceAgentRun[];
  coordinatorConclusion: string;
  conflictNote?: string;
  nextSteps: string[];
  riskNotes: string[];
}

export const AGENT_TYPE_LABEL: Record<SequenceAgentType, string> = {
  ARCHITECT: "架构 Agent",
  PRODUCT: "产品 Agent",
  CODE: "代码 Agent",
  QA: "QA Agent",
  SECURITY: "安全 Agent",
  PREDICTION: "预测 Agent",
  MEMORY: "记忆 Agent",
  WORLD: "世界 Agent",
  SOCIAL: "社交 Agent",
  SCHEDULER: "调度 Agent",
  ANALYTICS: "统计 Agent",
  CUSTOM: "自定义 Agent",
};

export const COLLAB_MODE_LABEL: Record<AgentCollabMode, string> = {
  SINGLE_AGENT: "单 Agent",
  PANEL_REVIEW: "多 Agent 评审",
  CHAIN_OF_AGENTS: "Agent 串行",
};
