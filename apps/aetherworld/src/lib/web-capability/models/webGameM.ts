import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webGameM = makeCapabilityModel({
  capabilityId: "WEB_GAME_M",
  name: "WebGameM",
  chineseName: "游戏能力模型",
  domain: "GAME",
  description: "游戏机制、关卡、任务、数值、世界规则、角色系统、Godot / Unity / Web game 草案。",
  inputTypes: ["WORLD_OBJECT", "GAME_IDEA", "QUEST_EVENT_OBJECT", "CHARACTER_OBJECT"],
  outputTypes: ["GAME_DESIGN_OBJECT", "GAME_LOOP_OBJECT", "QUEST_DESIGN_OBJECT", "LEVEL_OBJECT", "GAME_RULES_OBJECT", "GAME_EXPORT_PACK_OBJECT"],
  requiredKnowledgeSources: ["WORLD_KNOWLEDGE", "GAME_DESIGN_KNOWLEDGE"],
  requiredCalculusIds: ["GAME_LOOP_CALCULUS", "QUEST_CALCULUS"],
  requiredConstants: ["VIRTUAL_NOT_REAL", "NO_DANGEROUS_CODE"],
  toolInterfaces: ["WEBLWM", "APP_RUNTIME", "CODE_SANDBOX_BRIDGE", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "GAME_DESIGN_OBJECT"],
  safetyRules: ["CAP_SAFE_007", "CAP_SAFE_009", "CAP_SAFE_010"],
});
