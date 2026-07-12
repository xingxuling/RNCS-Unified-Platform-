import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webDesignM = makeCapabilityModel({
  capabilityId: "WEB_DESIGN_M",
  name: "WebDesignM",
  chineseName: "设计能力模型",
  domain: "DESIGN",
  description: "UI 结构、页面布局、视觉风格、组件层级、交互流程、设计 prompt、App UI Guide 输出。",
  inputTypes: ["APP_ARCHITECTURE_OBJECT", "PRODUCT_REQUIREMENT_OBJECT", "WORLD_STYLE_OBJECT", "DESIGN_TASK"],
  outputTypes: ["DESIGN_SPEC_OBJECT", "UI_LAYOUT_OBJECT", "COMPONENT_STYLE_OBJECT", "DESIGN_PROMPT_OBJECT", "APP_UI_GUIDE_OBJECT"],
  requiredKnowledgeSources: ["DESIGN_SYSTEM_KNOWLEDGE", "APP_RUNTIME_KNOWLEDGE"],
  requiredCalculusIds: ["DESIGN_LAYOUT_CALCULUS"],
  requiredConstants: ["INFO_DENSITY_BOUNDARY", "ACCESSIBILITY_BASELINE"],
  toolInterfaces: ["APP_RUNTIME", "PROMPT_FORGE", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "DESIGN_SPEC_OBJECT"],
});
