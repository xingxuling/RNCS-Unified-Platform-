import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webAgentM = makeCapabilityModel({
  capabilityId: "WEB_AGENT_M",
  name: "WebAgentM",
  chineseName: "Agent 能力模型",
  domain: "AGENT",
  description: "Agent 角色定义、工具权限、任务链、记忆策略、自主等级、Agent Binding Profile。",
  inputTypes: ["AGENT_TASK", "TOOL_LIST", "KNOWLEDGE_SOURCE", "PERSONALITY_SUMMARY"],
  outputTypes: ["AGENT_PROFILE_OBJECT", "AGENT_BINDING_PROFILE_OBJECT", "AGENT_WORKFLOW_OBJECT", "AGENT_QA_OBJECT"],
  requiredKnowledgeSources: ["AGENT_BINDING_KNOWLEDGE", "RUNTIME_SPINE_KNOWLEDGE"],
  requiredCalculusIds: ["AGENT_BINDING_CALCULUS"],
  requiredConstants: ["NO_AGENT_OVERREACH", "PRESERVE_CONSTITUTION"],
  toolInterfaces: ["AGENT_BINDING", "RUNTIME_SPINE", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "AGENT_PROFILE_OBJECT"],
  safetyRules: ["CAP_SAFE_006", "CAP_SAFE_009", "CAP_SAFE_010"],
});
