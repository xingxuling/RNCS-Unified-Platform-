export interface WebLlmModelPreset {
  modelId: string;
  displayName: string;
  modelFamily: string;
  estimatedSize: string;
  recommendedDevice: "LOW" | "MEDIUM" | "HIGH";
  recommendedUse: string[];
  contextWindow?: number;
  enabled: boolean;
  notes: string[];
}

export const WEB_LLM_MODEL_PRESETS: WebLlmModelPreset[] = [
  {
    modelId: "SMALL_CHAT_MODEL",
    displayName: "Small Chat Model",
    modelFamily: "chat",
    estimatedSize: "~600MB",
    recommendedDevice: "LOW",
    recommendedUse: ["Sequence AI 轻聊", "文档草案", "简单解释"],
    contextWindow: 4096,
    enabled: true,
    notes: ["首次加载会下载并缓存模型，可能耗时较长。"],
  },
  {
    modelId: "SMALL_CODE_MODEL",
    displayName: "Small Code Model",
    modelFamily: "code",
    estimatedSize: "~800MB",
    recommendedDevice: "MEDIUM",
    recommendedUse: ["代码草案", "错误解释", "Patch 建议"],
    contextWindow: 4096,
    enabled: true,
    notes: ["建议在 Code Sandbox / App Runtime 中使用。"],
  },
  {
    modelId: "SMALL_CREATIVE_MODEL",
    displayName: "Small Creative Model",
    modelFamily: "creative",
    estimatedSize: "~700MB",
    recommendedDevice: "MEDIUM",
    recommendedUse: ["歌词", "剧情", "Prompt"],
    contextWindow: 4096,
    enabled: true,
    notes: ["输出仍需 QA 与 System Constitution 守卫。"],
  },
  {
    modelId: "GENERAL_LOCAL_MODEL",
    displayName: "General Local Model",
    modelFamily: "general",
    estimatedSize: "~1.5GB",
    recommendedDevice: "HIGH",
    recommendedUse: ["通用本地推理"],
    contextWindow: 8192,
    enabled: false,
    notes: ["较大，仅推荐高配设备启用。"],
  },
  {
    modelId: "CUSTOM_WEBLLM_MODEL",
    displayName: "Custom WebLLM Model",
    modelFamily: "custom",
    estimatedSize: "unknown",
    recommendedDevice: "MEDIUM",
    recommendedUse: ["用户自定义"],
    enabled: false,
    notes: ["需用户提供 WebLLM 兼容 model id。"],
  },
];

export const DEFAULT_WEB_LLM_MODEL_ID = "SMALL_CHAT_MODEL";
