// Ollama via Gateway 适配器：让 LlmProviderRuntime 在 Ollama Provider 上优先走 Gateway。
// 当 Gateway 可用时返回结果；不可用时返回 null，由上层走原生 Ollama 适配器或回落。
import type { LlmProviderConfig, LlmRunRequest, LlmRunResult } from "@/lib/llm-providers/llmProviderTypes";
import { runChatViaGatewayProxy } from "./localGatewayModelProxy";

const nowIso = () => new Date().toISOString();

export async function tryRunOllamaViaGateway(
  cfg: LlmProviderConfig,
  req: LlmRunRequest,
): Promise<LlmRunResult | null> {
  if (cfg.providerType !== "OLLAMA") return null;
  const r = await runChatViaGatewayProxy({
    model: req.modelId || cfg.defaultModel || "qwen2.5:8b",
    messages: req.messages,
    temperature: req.temperature,
    maxTokens: req.maxTokens,
  });
  if (!r.ok) return null;
  return {
    runId: req.runId,
    providerId: cfg.providerId,
    modelId: req.modelId || cfg.defaultModel || "",
    status: "SUCCESS",
    text: r.content,
    qaStatus: "PASS",
    safetyNotes: ["来源：本地网关 / Ollama", ...r.safetyNotes],
    createdAt: nowIso(),
  };
}
