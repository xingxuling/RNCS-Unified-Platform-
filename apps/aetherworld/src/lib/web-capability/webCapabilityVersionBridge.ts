export const WEB_CAPABILITY_VERSION = {
  version: "0.7.0",
  changeType: ["RUNTIME_ADDED", "WEB_CAPABILITY_MODEL_LAYER_ADDED", "HUMAN_SKILL_MODEL_LAYER_ADDED"],
  affectedScopes: [
    "SEQUENCE_AI", "WEB_KNOWLEDGE_TRINITY", "WEBLCM", "WEBLLM", "WEBLWM",
    "APP_RUNTIME", "CODE_SANDBOX", "VOCAL_ENGINE", "NARRATIVE_ENGINE",
    "WORKSPACE", "QA", "SYSTEM_CONSTITUTION", "VERSION",
  ],
  recommendedLevel: "LEAP" as const,
  releaseType: "WEB_HUMAN_CAPABILITY_MODELS_RELEASE",
  reason: "Aetherworld 从知识、计算法、常数、概念、语言、世界层，进一步扩展为 WebXX 人类能力模型群。",
};

export function describeWebCapabilityVersionLeap() {
  return WEB_CAPABILITY_VERSION;
}
