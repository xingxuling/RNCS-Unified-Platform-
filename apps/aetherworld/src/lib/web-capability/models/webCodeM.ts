import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webCodeM = makeCapabilityModel({
  capabilityId: "WEB_CODE_M",
  name: "WebCodeM",
  chineseName: "代码能力模型",
  domain: "CODE",
  description: "需求转代码、文件树设计、代码草案、错误解释、修复建议、Patch 草案、Codex / Cursor handoff。",
  inputTypes: ["APP_PROJECT_OBJECT", "CODE_DRAFT_OBJECT", "ERROR_SUMMARY_OBJECT", "PATCH_DRAFT_OBJECT", "USER_CODE_TASK"],
  outputTypes: ["CODE_PLAN_OBJECT", "FILE_TREE_OBJECT", "CODE_DRAFT_OBJECT", "REPAIR_SUGGESTION_OBJECT", "PATCH_DRAFT_OBJECT", "CODEX_HANDOFF_PACK_OBJECT"],
  requiredKnowledgeSources: ["APP_RUNTIME_KNOWLEDGE", "CODE_SANDBOX_KNOWLEDGE", "PATCH_KNOWLEDGE"],
  requiredCalculusIds: ["APP_RUNTIME_CALCULUS", "CODE_SANDBOX_CALCULUS", "PATCH_CALCULUS"],
  requiredConstants: ["NO_DANGEROUS_CODE", "SIMULATION_NOT_EXECUTION", "LOCAL_FIRST"],
  toolInterfaces: ["APP_RUNTIME", "CODE_SANDBOX_BRIDGE", "PATCH_ENGINE", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "CODE_DRAFT_OBJECT", "PATCH_DRAFT_OBJECT"],
  safetyRules: ["CAP_SAFE_004", "CAP_SAFE_009", "CAP_SAFE_010"],
});
