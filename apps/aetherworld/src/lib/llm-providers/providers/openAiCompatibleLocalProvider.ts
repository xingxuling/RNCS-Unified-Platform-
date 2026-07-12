// OpenAI-Compatible 本地接口适配器（适用 llama.cpp server / vLLM / LM Studio / LocalAI 等）
import type {
  LlmProviderAdapter,
  LlmProviderConfig,
  LlmRunRequest,
  LlmRunResult,
  LlmStreamHandlers,
  LlmModelOption,
} from "../llmProviderTypes";

const nowIso = () => new Date().toISOString();

function authHeaders(cfg: LlmProviderConfig): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.apiKey) h["Authorization"] = `Bearer ${cfg.apiKey}`;
  return h;
}

export const openAiCompatibleLocalProvider: LlmProviderAdapter = {
  type: "OPENAI_COMPATIBLE_LOCAL",

  async healthCheck(cfg) {
    if (!cfg.baseUrl) return { status: "ERROR", message: "未配置接口地址" };
    const start = performance.now();
    try {
      const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/models`, {
        headers: authHeaders(cfg),
      });
      if (res.status === 401) return { status: "AUTH_REQUIRED" };
      if (!res.ok) return { status: "ERROR", message: `HTTP ${res.status}` };
      const latencyMs = Math.round(performance.now() - start);
      return { status: "READY", latencyMs };
    } catch (e) {
      return { status: "UNREACHABLE", message: (e as Error).message };
    }
  },

  async listModels(cfg) {
    if (!cfg.baseUrl) return [];
    try {
      const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/models`, {
        headers: authHeaders(cfg),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      return (data.data || []).map<LlmModelOption>((m) => ({
        modelId: m.id,
        displayName: m.id,
        providerId: cfg.providerId,
        localOnly: true,
        recommendedUse: ["chat"],
        status: "AVAILABLE",
      }));
    } catch {
      return [];
    }
  },

  async runChat(cfg, req, handlers) {
    if (!cfg.baseUrl) {
      const r: LlmRunResult = {
        runId: req.runId,
        providerId: cfg.providerId,
        modelId: req.modelId,
        status: "FAILED",
        text: "",
        qaStatus: "FAIL",
        safetyNotes: ["未配置接口地址"],
        createdAt: nowIso(),
      };
      handlers?.onError?.(new Error("未配置接口地址"));
      return r;
    }
    const start = performance.now();
    const body = {
      model: req.modelId || cfg.defaultModel,
      messages: req.messages,
      temperature: req.temperature,
      stream: !!req.stream,
      ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
    };

    try {
      const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: authHeaders(cfg),
        body: JSON.stringify(body),
        signal: handlers?.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      let fullText = "";

      if (!req.stream) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        fullText = data.choices?.[0]?.message?.content ?? "";
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let done = false;
        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(json) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                handlers?.onDelta?.(delta);
              }
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }
      }

      const result: LlmRunResult = {
        runId: req.runId,
        providerId: cfg.providerId,
        modelId: body.model || "",
        status: "SUCCESS",
        text: fullText,
        qaStatus: "PASS",
        latencyMs: Math.round(performance.now() - start),
        safetyNotes: [],
        createdAt: nowIso(),
      };
      handlers?.onDone?.(result);
      return result;
    } catch (e) {
      const err = e as Error;
      const result: LlmRunResult = {
        runId: req.runId,
        providerId: cfg.providerId,
        modelId: req.modelId,
        status: "FAILED",
        text: "",
        qaStatus: "FAIL",
        safetyNotes: [err.message],
        createdAt: nowIso(),
      };
      handlers?.onError?.(err);
      return result;
    }
  },
};
