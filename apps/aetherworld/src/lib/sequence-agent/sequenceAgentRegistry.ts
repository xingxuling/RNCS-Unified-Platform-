// 数列 Agent 注册表
// 不重建：基于既有 DIGITAL_ROLE_REGISTRY 适配为 SequenceAgent，并补齐 Aetherworld 新链路所需的系统 Agent。
import { DIGITAL_ROLE_REGISTRY } from "@/lib/digital-roles/digitalRoleRegistry";
import type {
  SequenceAgent,
  SequenceAgentType,
  AgentAuthorityLevel,
  AgentSafetyLevel,
} from "./sequenceAgentTypes";

const ROLE_TO_AGENT_TYPE: Record<string, SequenceAgentType> = {
  DIGITAL_FOUNDER: "ARCHITECT",
  DIGITAL_ARCHITECT: "ARCHITECT",
  DIGITAL_PRODUCT_MANAGER: "PRODUCT",
  DIGITAL_PROGRAMMER: "CODE",
  DIGITAL_PLANNER: "SCHEDULER",
  DIGITAL_DESIGNER: "PRODUCT",
  DIGITAL_RESEARCHER: "ANALYTICS",
  DIGITAL_QA: "QA",
  DIGITAL_DOCUMENTATION_LEAD: "MEMORY",
  DIGITAL_OPERATOR: "SOCIAL",
  DIGITAL_GROWTH_STRATEGIST: "ANALYTICS",
  DIGITAL_GOVERNANCE_OFFICER: "SECURITY",
  DIGITAL_WORLD_BUILDER: "WORLD",
  DIGITAL_NARRATIVE_DIRECTOR: "WORLD",
  DIGITAL_MUSIC_DIRECTOR: "WORLD",
  DIGITAL_SYSTEM_STRATEGIST: "PREDICTION",
};

const AUTH_MAP: Record<string, AgentAuthorityLevel> = {
  PLAN: "HIGH",
  DESIGN: "MEDIUM",
  EXECUTE: "MEDIUM",
  REVIEW: "MEDIUM",
  OBSERVE: "LOW",
};

function safetyOf(roleId: string): AgentSafetyLevel {
  if (/founder|governance/i.test(roleId)) return "HIGH";
  if (/programmer|operator/i.test(roleId)) return "HIGH";
  return "MEDIUM";
}

/** 由数字角色派生的 Agent（首批；不覆盖原数字角色注册表） */
const DERIVED_AGENTS: SequenceAgent[] = DIGITAL_ROLE_REGISTRY.map((r) => {
  const agentType = ROLE_TO_AGENT_TYPE[r.roleType] ?? "CUSTOM";
  return {
    id: `agent-${r.roleId.replace(/^role-/, "")}`,
    name: r.englishName,
    cnName: r.chineseName,
    agentType,
    personaSource: "DIGITAL_ROLE",
    digitalRoleId: r.roleId,
    description: r.description,
    domain: r.coreResponsibility,
    allowedTools: r.allowedActions,
    deniedTools: r.forbiddenActions,
    memoryScope: "HYBRID",
    promptContractId: undefined,
    authorityLevel: AUTH_MAP[r.authorityLevel] ?? "MEDIUM",
    safetyLevel: safetyOf(r.roleId),
    enabled: r.status === "ACTIVE",
    createdAt: "2026-05-25T00:00:00.000Z",
  };
});

/** 补齐 Aetherworld 新链路需要、但既有数字角色未覆盖的系统 Agent */
const SYSTEM_AGENTS: SequenceAgent[] = [
  {
    id: "ARCHITECT_AGENT",
    name: "Architect Agent",
    cnName: "架构 Agent",
    agentType: "ARCHITECT",
    personaSource: "SEQUENCE_ROLE",
    description: "负责系统架构、模块归位、Legacy Module Bridge、跨域融合结构与技术路线。",
    domain: ["系统架构", "模块归位", "跨域融合", "技术路线"],
    allowedTools: ["架构图", "模块清单", "Bridge Plan"],
    deniedTools: ["执行 shell", "公开发布", "支付"],
    memoryScope: "HYBRID",
    authorityLevel: "HIGH",
    safetyLevel: "MEDIUM",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "PRODUCT_AGENT",
    name: "Product Agent",
    cnName: "产品 Agent",
    agentType: "PRODUCT",
    personaSource: "SEQUENCE_ROLE",
    description: "负责用户链路、UI/UX、功能优先级、商业化入口、内测体验。",
    domain: ["用户链路", "UI/UX", "优先级", "内测体验"],
    allowedTools: ["产品建议", "用户故事", "优先级排序"],
    deniedTools: ["绕过 QA", "代用户做承诺"],
    memoryScope: "HYBRID",
    authorityLevel: "MEDIUM",
    safetyLevel: "MEDIUM",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "CODE_AGENT",
    name: "Code Agent",
    cnName: "代码 Agent",
    agentType: "CODE",
    personaSource: "SEQUENCE_ROLE",
    description: "负责 App Runtime、Code Sandbox、Patch、Handoff 与代码检查。",
    domain: ["代码生成", "Patch", "Handoff", "代码检查"],
    allowedTools: ["Patch 草案", "Handoff Pack", "Sandbox 运行"],
    deniedTools: ["真实部署", "删除文件", "执行任意 shell"],
    memoryScope: "HYBRID",
    authorityLevel: "HIGH",
    safetyLevel: "HIGH",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "QA_AGENT",
    name: "QA Agent",
    cnName: "QA Agent",
    agentType: "QA",
    personaSource: "SEQUENCE_ROLE",
    description: "负责 Bug Audit、测试用例、P0/P1 风险与回验。",
    domain: ["Bug Audit", "测试用例", "风险评估", "回验"],
    allowedTools: ["Bug 报告", "测试用例", "回归检查"],
    deniedTools: ["绕过 QA 流程"],
    memoryScope: "HYBRID",
    authorityLevel: "MEDIUM",
    safetyLevel: "MEDIUM",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "SECURITY_AGENT",
    name: "Security Agent",
    cnName: "安全 Agent",
    agentType: "SECURITY",
    personaSource: "SEQUENCE_ROLE",
    description: "负责 Secret Guard、权限、公开发布门槛、Founder-only 与 Full60 防泄漏。",
    domain: ["Secret Guard", "权限", "公开发布", "Founder-only"],
    allowedTools: ["权限审查", "脱敏建议", "发布门槛"],
    deniedTools: ["绕过 Secret Guard", "公开 Full60", "公开 Founder-only"],
    memoryScope: "PRIVATE",
    authorityLevel: "FOUNDER_ONLY",
    safetyLevel: "HIGH",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "PREDICTION_AGENT",
    name: "Prediction Agent",
    cnName: "预测 Agent",
    agentType: "PREDICTION",
    personaSource: "SEQUENCE_ROLE",
    description: "负责 Sequence Prediction、风险窗口、行动许可与复查节点。",
    domain: ["数列预测", "风险窗口", "行动许可", "复查节点"],
    allowedTools: ["轨迹生成", "概率区间", "复查节点草案"],
    deniedTools: ["确定性承诺", "金融买卖指令"],
    memoryScope: "HYBRID",
    authorityLevel: "MEDIUM",
    safetyLevel: "HIGH",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "MEMORY_AGENT",
    name: "Memory Agent",
    cnName: "记忆 Agent",
    agentType: "MEMORY",
    personaSource: "SEQUENCE_ROLE",
    description: "负责 Sequence Memory、记录权重、上下文压缩与长期记忆检索。",
    domain: ["记忆压缩", "权重打分", "上下文检索"],
    allowedTools: ["记忆单元", "权重调整", "上下文摘要"],
    deniedTools: ["保存 Secret", "保存 Full60", "保存 Founder-only 原文"],
    memoryScope: "SHARED",
    authorityLevel: "MEDIUM",
    safetyLevel: "MEDIUM",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "WORLD_AGENT",
    name: "World Agent",
    cnName: "世界 Agent",
    agentType: "WORLD",
    personaSource: "SEQUENCE_ROLE",
    description: "负责 World Engine、Narrative、Vocal、虚拟世界角色与剧情。",
    domain: ["World Engine", "Narrative", "Vocal", "剧情"],
    allowedTools: ["世界草案", "叙事草案", "歌词草案"],
    deniedTools: ["真实发布", "版权承诺"],
    memoryScope: "HYBRID",
    authorityLevel: "MEDIUM",
    safetyLevel: "MEDIUM",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "SCHEDULER_AGENT",
    name: "Scheduler Agent",
    cnName: "调度 Agent",
    agentType: "SCHEDULER",
    personaSource: "SEQUENCE_ROLE",
    description: "负责任务拆解、ExecutionPlan、Calendar Trigger 与 Scheduler Runtime。",
    domain: ["任务拆解", "ExecutionPlan", "Calendar", "调度"],
    allowedTools: ["AetherTask 创建", "ExecutionPlan", "Calendar 草案"],
    deniedTools: ["绕过 Tool Permission Guard", "自动支付", "自动部署"],
    memoryScope: "HYBRID",
    authorityLevel: "MEDIUM",
    safetyLevel: "MEDIUM",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
  {
    id: "ANALYTICS_AGENT",
    name: "Analytics Agent",
    cnName: "统计 Agent",
    agentType: "ANALYTICS",
    personaSource: "SEQUENCE_ROLE",
    description: "负责 Analytics、Value Ledger、模型耗时、使用统计与产品自进化数据。",
    domain: ["Analytics", "Value Ledger", "模型耗时", "使用统计"],
    allowedTools: ["统计查询", "排行榜", "趋势草案"],
    deniedTools: ["公开私密统计", "未脱敏数据导出"],
    memoryScope: "SHARED",
    authorityLevel: "LOW",
    safetyLevel: "LOW",
    enabled: true,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
];

export const SEQUENCE_AGENT_REGISTRY: SequenceAgent[] = [
  ...SYSTEM_AGENTS,
  ...DERIVED_AGENTS,
];

export function listSequenceAgents(): SequenceAgent[] {
  return SEQUENCE_AGENT_REGISTRY.filter((a) => a.enabled);
}

export function getAgentById(id: string): SequenceAgent | undefined {
  return SEQUENCE_AGENT_REGISTRY.find((a) => a.id === id);
}

export function getAgentsByType(type: SequenceAgentType): SequenceAgent[] {
  return SEQUENCE_AGENT_REGISTRY.filter((a) => a.agentType === type && a.enabled);
}

export function getSystemAgentByType(type: SequenceAgentType): SequenceAgent | undefined {
  return SYSTEM_AGENTS.find((a) => a.agentType === type);
}
