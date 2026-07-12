// Custom Provider：默认走 OpenAI-Compatible Chat Completions
import { openAiCompatibleLocalProvider } from "./openAiCompatibleLocalProvider";
import type { LlmProviderAdapter } from "../llmProviderTypes";

export const customProvider: LlmProviderAdapter = {
  ...openAiCompatibleLocalProvider,
  type: "CUSTOM",
};

export const vllmProvider: LlmProviderAdapter = {
  ...openAiCompatibleLocalProvider,
  type: "VLLM",
};

export const llamaCppProvider: LlmProviderAdapter = {
  ...openAiCompatibleLocalProvider,
  type: "LLAMA_CPP",
};
