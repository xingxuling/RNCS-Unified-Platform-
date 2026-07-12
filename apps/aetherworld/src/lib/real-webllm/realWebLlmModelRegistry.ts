// Real WebLLM 模型注册表 —— 默认走小模型，避免低配设备崩溃
export type DeviceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RealWebLlmModelOption {
  modelId: string;
  displayName: string;
  chineseName: string;
  modelFamily: string;
  recommendedDevice: DeviceLevel;
  useCases: string[];
  enabled: boolean;
  warning?: string;
  group: "CHAT_LIGHT" | "CODE" | "CREATIVE" | "CUSTOM";
}

// 这些 modelId 来自 @mlc-ai/web-llm 的官方 prebuilt 列表。
// 优先小模型，初次加载也要数百 MB。
export const REAL_WEBLLM_MODELS: RealWebLlmModelOption[] = [
  {
    modelId: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    chineseName: "通义千问 0.5B（轻量）",
    displayName: "Qwen2.5-0.5B-Instruct",
    modelFamily: "Qwen",
    recommendedDevice: "LOW",
    useCases: ["对话", "简短解释", "快速测试"],
    enabled: true,
    group: "CHAT_LIGHT",
  },
  {
    modelId: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    chineseName: "Llama 3.2 1B（轻量聊天）",
    displayName: "Llama-3.2-1B-Instruct",
    modelFamily: "Llama",
    recommendedDevice: "LOW",
    useCases: ["对话", "写作", "文档"],
    enabled: true,
    group: "CHAT_LIGHT",
  },
  {
    modelId: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    chineseName: "Llama 3.2 3B（中等）",
    displayName: "Llama-3.2-3B-Instruct",
    modelFamily: "Llama",
    recommendedDevice: "MEDIUM",
    useCases: ["对话", "解释", "写作"],
    enabled: true,
    warning: "首次加载约 1.5GB，需要较多显存。",
    group: "CHAT_LIGHT",
  },
  {
    modelId: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
    chineseName: "Qwen Coder 1.5B（代码）",
    displayName: "Qwen2.5-Coder-1.5B-Instruct",
    modelFamily: "Qwen-Coder",
    recommendedDevice: "MEDIUM",
    useCases: ["代码草案", "错误解释", "README", "修复建议"],
    enabled: true,
    group: "CODE",
  },
  {
    modelId: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    chineseName: "通义千问 1.5B（创作）",
    displayName: "Qwen2.5-1.5B-Instruct",
    modelFamily: "Qwen",
    recommendedDevice: "MEDIUM",
    useCases: ["歌词", "剧情", "Prompt", "世界描述"],
    enabled: true,
    group: "CREATIVE",
  },
];

export function findModel(modelId: string): RealWebLlmModelOption | undefined {
  return REAL_WEBLLM_MODELS.find((m) => m.modelId === modelId);
}

export function defaultModelId(): string {
  return REAL_WEBLLM_MODELS[0].modelId;
}

export function modelsByGroup() {
  const groups: Record<string, RealWebLlmModelOption[]> = {};
  for (const m of REAL_WEBLLM_MODELS) {
    (groups[m.group] ||= []).push(m);
  }
  return groups;
}

export const GROUP_LABELS: Record<string, string> = {
  CHAT_LIGHT: "轻量聊天模型",
  CODE: "代码辅助模型",
  CREATIVE: "创作辅助模型",
  CUSTOM: "自定义模型 ID",
};
