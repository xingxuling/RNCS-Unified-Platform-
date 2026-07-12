// 注册所有 Provider 适配器
import type { LlmProviderAdapter, LlmProviderType } from "./llmProviderTypes";
import { webLlmProvider } from "./providers/webLlmProvider";
import { ollamaProvider } from "./providers/ollamaProvider";
import { openAiCompatibleLocalProvider } from "./providers/openAiCompatibleLocalProvider";
import { customProvider, vllmProvider, llamaCppProvider } from "./providers/customProvider";

const REGISTRY: Record<LlmProviderType, LlmProviderAdapter> = {
  WEBLLM: webLlmProvider,
  OLLAMA: ollamaProvider,
  OPENAI_COMPATIBLE_LOCAL: openAiCompatibleLocalProvider,
  VLLM: vllmProvider,
  LLAMA_CPP: llamaCppProvider,
  CUSTOM: customProvider,
};

export function getAdapter(type: LlmProviderType): LlmProviderAdapter {
  return REGISTRY[type] || customProvider;
}

export function listAdapters(): LlmProviderAdapter[] {
  return Object.values(REGISTRY);
}
