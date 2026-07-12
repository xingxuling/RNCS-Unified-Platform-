import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webStrategyM = makeCapabilityModel({
  capabilityId: "WEB_STRATEGY_M",
  name: "WebStrategyM",
  chineseName: "战略能力模型",
  domain: "STRATEGY",
  description: "方向判断、优先级、路线图、风险矩阵、递归跃迁判断、资源分配。",
  inputTypes: ["SYSTEM_STATUS", "PRODUCT_STATUS", "MISSING_LAYER_RESULT", "RECURSIVE_LEAP_RESULT", "STRATEGIC_QUESTION"],
  outputTypes: ["STRATEGY_REPORT_OBJECT", "PRIORITY_MAP_OBJECT", "ROADMAP_OBJECT", "RISK_MATRIX_OBJECT", "NEXT_ACTION_OBJECT"],
  requiredKnowledgeSources: ["SYSTEM_STATUS_KNOWLEDGE", "MISSING_LAYER_KNOWLEDGE", "VERSION_KNOWLEDGE"],
  requiredCalculusIds: ["STRATEGY_CALCULUS", "MISSING_LAYER_CALCULUS", "RECURSIVE_LEAP_CALCULUS"],
  requiredConstants: ["NO_OVERCLAIM", "PRESERVE_CONSTITUTION"],
  toolInterfaces: ["WEBCM", "WEBCOM", "MISSING_LAYER_ENGINE", "RECURSIVE_LEAP_ENGINE"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "STRATEGY_REPORT_OBJECT"],
});
