export const WEB_LLM_FALLBACK_MODES = [
  { id: "NONE",              label: "无降级",      description: "WebLLM 正常运行。" },
  { id: "RULE_ONLY",         label: "规则层",      description: "完全使用规则层。" },
  { id: "NO_WEBGPU",         label: "无 WebGPU",   description: "浏览器不支持 WebGPU。" },
  { id: "MODEL_LOAD_FAILED", label: "模型加载失败", description: "模型加载失败，使用规则层。" },
  { id: "USER_CANCELLED",    label: "用户取消",    description: "用户取消模型加载或生成。" },
] as const;
export type WebLlmFallbackModeId = typeof WEB_LLM_FALLBACK_MODES[number]["id"];
