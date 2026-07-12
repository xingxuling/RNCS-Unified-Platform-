import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webProductM = makeCapabilityModel({
  capabilityId: "WEB_PRODUCT_M",
  name: "WebProductM",
  chineseName: "产品能力模型",
  domain: "PRODUCT",
  description: "想法转产品、MVP、用户故事、功能优先级、PRD、验收标准、Non-goals、App Runtime 输入。",
  inputTypes: ["USER_PRODUCT_IDEA", "APP_IDEA_OBJECT", "PRODUCT_ENTRY", "WORKSPACE_PROJECT"],
  outputTypes: ["PRODUCT_REQUIREMENT_OBJECT", "MVP_SCOPE_OBJECT", "USER_STORY_OBJECT", "ACCEPTANCE_CRITERIA_OBJECT", "APP_PROJECT_REQUEST_OBJECT"],
  requiredKnowledgeSources: ["PRODUCT_KNOWLEDGE", "APP_RUNTIME_KNOWLEDGE", "USER_RESEARCH_KNOWLEDGE"],
  requiredCalculusIds: ["PRODUCT_DEFINITION_CALCULUS", "APP_RUNTIME_CALCULUS"],
  requiredConstants: ["USER_VALUE_FIRST", "MVP_SCOPE_BOUNDARY"],
  toolInterfaces: ["APP_RUNTIME", "WORKSPACE", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "PRODUCT_REQUIREMENT_OBJECT"],
});
