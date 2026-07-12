// Ollama 适配器
import type {
  LlmProviderAdapter,
  LlmProviderConfig,
  LlmRunRequest,
  LlmRunResult,
  LlmStreamHandlers,
  LlmModelOption,
} from "../llmProviderTypes";

const nowIso = () => new Date().toISOString();

export const ollamaProvider: LlmProviderAdapter = {
  type: "OLLAMA",

  async healthCheck(cfg) {
    const base = cfg.baseUrl || "http://localhost:11434";
    const start = performance.now();
    try {
      const res = await fetch(`${base}/api/tags`, { method: "GET" });
      if (!res.ok) return { status: "ERROR", message: `HTTP ${res.status}` };
      const data = (await res.json()) as { models?: unknown[] };
      const latencyMs = Math.round(performance.now() - start);
      if (!data.models || data.models.length === 0)
        return { status: "NO_MODEL", latencyMs, message: "未发现模型，请先 ollama pull" };
      return { status: "READY", latencyMs };
    } catch (e) {
      return { status: "UNREACHABLE", message: (e as Error).message };
    }
  },

  async listModels(cfg) {
    const base = cfg.baseUrl || "http://localhost:11434";
    const res = await fetch(`${base}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: Array<{ name: string; size?: number }> };
    return (data.models || []).map<LlmModelOption>((m) => ({
      modelId: m.name,
      displayName: m.name,
      providerId: cfg.providerId,
      localOnly: true,
      recommendedUse: ["chat"],
      status: "INSTALLED",
    }));
  },

  async runChat(cfg, req, handlers) {
    const base = cfg.baseUrl || "http://localhost:11434";
    const start = performance.now();
    const body = {
      model: req.modelId || cfg.defaultModel || "qwen2.5:8b",
      messages: req.messages,
      stream: !!req.stream,
      options: {
        temperature: req.temperature,
        ...(req.maxTokens ? { num_predict: req.maxTokens } : {}),
      },
    };

    try {
      const res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: handlers?.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Ollama HTTP ${res.status}`);

      let fullText = "";

      if (!req.stream) {
        const data = (await res.json()) as { message?: { content?: string } };
        fullText = data.message?.content ?? "";
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            try {
              const parsed = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
              const delta = parsed.message?.content;
              if (delta) {
                fullText += delta;
                handlers?.onDelta?.(delta);
              }
            } catch {
              /* partial */
            }
          }
        }
      }

      const result: LlmRunResult = {
        runId: req.runId,
        providerId: cfg.providerId,
        modelId: body.model,
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
        modelId: body.model,
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
