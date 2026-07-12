export const WEBXXM_COMPATIBILITY_RULES = [
  { id: "MIN_AETHER_VERSION", description: "能力包要求的最小 Aetherworld 版本必须满足。" },
  { id: "REQUIRED_RUNTIMES",  description: "声明的运行时依赖（WebLLM/WebLCM/WebLWM 等）必须可用。" },
  { id: "REQUIRED_PACKAGES",  description: "依赖的其他 WebXXM 能力包必须已 ENABLED。" },
] as const;
export const CURRENT_AETHER_VERSION = "0.9.0";
