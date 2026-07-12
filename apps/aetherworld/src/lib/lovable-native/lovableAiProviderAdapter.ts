/**
 * Lovable AI Provider Adapter
 *
 * 把 Lovable AI Gateway 包装成 Aetherworld LlmProviderRuntime 的一种 provider。
 * 这里只提供 ProviderConfig 与一个最薄的调用包装（通过 Edge Function 中转）。
 * 真实调用必须在后端进行，不能从前端直接带 LOVABLE_API_KEY。
 */
import type { LlmProviderConfig } from "@/lib/llm-providers/llmProviderTypes";

export const LOVABLE_AI_DEFAULT_MODEL = "google/gemini-3-flash-preview";

export const LOVABLE_AI_MODELS: { id: string; label: string; note: string }[] = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (预览)", note: "默认，速度与成本平衡。" },
  { id: "google/gemini-2.5-pro",         label: "Gemini 2.5 Pro",        note: "强推理 / 多模态。" },
  { id: "google/gemini-2.5-flash",       label: "Gemini 2.5 Flash",      note: "性价比首选。" },
  { id: "openai/gpt-5-mini",             label: "GPT-5 Mini",            note: "OpenAI 平衡款。" },
  { id: "openai/gpt-5",                  label: "GPT-5",                 note: "最强综合表现，最贵。" },
];

/**
 * 构造一个 Lovable AI 的默认 ProviderConfig（用于 LlmProviderRuntime）。
 * 注意：providerType 在 LlmProviderType 联合里仍是 CUSTOM，
 *       通过 displayName / chineseName 标识为 Lovable AI。
 */
export function buildLovableAiProviderConfig(model = LOVABLE_AI_DEFAULT_MODEL): LlmProviderConfig {
  const now = new Date().toISOString();
  return {
    providerId: "lovable-ai-default",
    providerType: "CUSTOM",
    displayName: "Lovable AI",
    chineseName: "Lovable AI 网关",
    enabled: true,
    // 注意：前端代码不会直接打这个地址，必须经由后端中转，这里仅作为「标识」。
    baseUrl: "https://ai.gateway.lovable.dev/v1",
    defaultModel: model,
    supportsStreaming: true,
    supportsEmbeddings: true,
    supportsModelList: false,
    supportsToolCalling: true,
    requestFormat: "OPENAI_CHAT_COMPLETIONS",
    priority: 50,
    createdAt: now,
    updatedAt: now,
  };
}

export function isLovableAiProvider(cfg: LlmProviderConfig): boolean {
  return cfg.providerId.startsWith("lovable-ai") || cfg.chineseName === "Lovable AI 网关";
}
