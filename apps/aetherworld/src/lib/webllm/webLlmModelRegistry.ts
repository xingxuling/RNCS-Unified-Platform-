import { WEB_LLM_MODEL_PRESETS, DEFAULT_WEB_LLM_MODEL_ID, type WebLlmModelPreset } from "@/constants/webllm/webLlmModelPresets";

export function listWebLlmModels(): WebLlmModelPreset[] {
  return WEB_LLM_MODEL_PRESETS.filter((m) => m.enabled !== false || m.modelId === "CUSTOM_WEBLLM_MODEL");
}

export function getWebLlmModel(modelId: string): WebLlmModelPreset | undefined {
  return WEB_LLM_MODEL_PRESETS.find((m) => m.modelId === modelId);
}

export function getDefaultModel(): WebLlmModelPreset {
  return getWebLlmModel(DEFAULT_WEB_LLM_MODEL_ID)!;
}
