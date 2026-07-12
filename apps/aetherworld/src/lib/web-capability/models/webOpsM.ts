import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webOpsM = makeCapabilityModel({
  capabilityId: "WEB_OPS_M",
  name: "WebOpsM",
  chineseName: "运营能力模型",
  domain: "OPERATIONS",
  description: "内容运营、发布计划、更新日志、用户反馈整理、社媒草案、产品公告。不虚假宣传，不夸大未实现能力。",
  inputTypes: ["PRODUCT_UPDATE", "VERSION_RECORD", "USER_FEEDBACK", "CONTENT_GOAL"],
  outputTypes: ["RELEASE_NOTE_OBJECT", "CONTENT_PLAN_OBJECT", "SOCIAL_POST_DRAFT_OBJECT", "FEEDBACK_SUMMARY_OBJECT", "OPERATION_PLAN_OBJECT"],
  requiredKnowledgeSources: ["VERSION_KNOWLEDGE", "PRODUCT_KNOWLEDGE"],
  requiredCalculusIds: ["OPS_CALCULUS"],
  requiredConstants: ["NO_FALSE_ADVERTISING", "NO_FOUNDER_ONLY_LEAK"],
  toolInterfaces: ["VERSION_LEAP", "TEXT_DYNAMIC_UPDATE", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "RELEASE_NOTE_OBJECT"],
  safetyRules: ["CAP_SAFE_005", "CAP_SAFE_009", "CAP_SAFE_010"],
});
