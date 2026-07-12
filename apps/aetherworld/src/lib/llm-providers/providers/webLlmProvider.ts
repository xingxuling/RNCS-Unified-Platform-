// WebLLM 适配器（浏览器本地）
// 委托给项目已有的 WebLLM Runtime；若未就绪则返回 NO_MODEL，由 fallback 处理。
import type {
  LlmProviderAdapter,
  LlmRunResult,
  LlmStreamHandlers,
  LlmModelOption,
} from "../llmProviderTypes";

const nowIso = () => new Date().toISOString();

async function tryGetRealWebLlm() {
  try {
    const mod: any = await import("@/lib/real-webllm/aetherRealWebLlmRuntime");
    return mod;
  } catch {
    return null;
  }
}

export const webLlmProvider: LlmProviderAdapter = {
  type: "WEBLLM",

  async healthCheck() {
    if (typeof navigator !== "undefined" && !(navigator as any).gpu) {
      return { status: "ERROR", message: "当前浏览器不支持 WebGPU" };
    }
    return { status: "READY" };
  },

  async listModels(cfg): Promise<LlmModelOption[]> {
    return [
      {
        modelId: cfg.defaultModel || "Qwen2.5-7B-Instruct-q4f16_1-MLC",
        displayName: cfg.defaultModel || "Qwen2.5 7B (WebLLM)",
        providerId: cfg.providerId,
        localOnly: true,
        recommendedUse: ["chat"],
        status: "AVAILABLE",
      },
    ];
  },

  async runChat(cfg, req, handlers?: LlmStreamHandlers): Promise<LlmRunResult> {
    const start = performance.now();
    const modelId = req.modelId || cfg.defaultModel || "Qwen2.5-7B-Instruct-q4f16_1-MLC";

    try {
      const mod: any = await tryGetRealWebLlm();
      if (!mod || typeof mod.runRealWebLlmChat !== "function") {
        throw new Error("WebLLM 运行时不可用");
      }
      const prompt = req.messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      const runReq = {
        requestId: req.runId,
        prompt,
        stream: req.stream,
        temperature: req.temperature,
        maxTokens: req.maxTokens,
      };
      const r: any = await mod.runRealWebLlmChat(runReq, {
        onToken: (t: string) => handlers?.onDelta?.(t),
        onError: (e: string) => { throw new Error(e); },
      });
      const text: string = r?.text ?? "";
      if (r?.status === "FALLBACK" || r?.status === "FAILED") {
        throw new Error(r?.safetyNotes?.[0] || "WebLLM 未就绪");
      }

      const result: LlmRunResult = {
        runId: req.runId,
        providerId: cfg.providerId,
        modelId,
        status: "SUCCESS",
        text: text || "",
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
        modelId,
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
