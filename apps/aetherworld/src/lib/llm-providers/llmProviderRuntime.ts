// 统一调用入口：runLlmChat
// Chat / WebCodeM / App Runtime / Code Sandbox 都通过这里调用模型
import type {
  LlmMessage,
  LlmRunRequest,
  LlmRunResult,
  LlmStreamHandlers,
  LlmProviderConfig,
  LlmProviderType,
} from "./llmProviderTypes";
import { getAdapter } from "./llmProviderRegistry";
import {
  loadProviders,
  getDefaultProviderId,
  getAutoOrder,
} from "./llmProviderSettings";
import { applySafetyGuard } from "./llmProviderSafetyGuard";
import { checkProvider } from "./llmProviderHealthCheck";
import { sanitizeModelContext, summarizeSanitization } from "@/lib/security/modelContextSanitizer";

const nowIso = () => new Date().toISOString();
const RESULT_KEY = "aether.llmProviders.runResults.v1";
const MAX_RESULTS = 50;

export interface RunChatOptions {
  messages: LlmMessage[];
  sourceModule?: string;
  taskType?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  providerId?: string; // 强制使用某个 Provider
  modelId?: string;
  handlers?: LlmStreamHandlers;
}

function saveResult(r: LlmRunResult) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RESULT_KEY);
    const arr: LlmRunResult[] = raw ? JSON.parse(raw) : [];
    arr.unshift(r);
    localStorage.setItem(RESULT_KEY, JSON.stringify(arr.slice(0, MAX_RESULTS)));
  } catch {
    /* noop */
  }
}

export function listRecentResults(): LlmRunResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as LlmRunResult[]) : [];
  } catch {
    return [];
  }
}

async function resolveProvider(preferredId?: string): Promise<LlmProviderConfig | null> {
  const all = loadProviders().filter((p) => p.enabled);
  if (preferredId) {
    const found = all.find((p) => p.providerId === preferredId);
    if (found) return found;
  }
  const defaultId = getDefaultProviderId();
  if (defaultId !== "AUTO") {
    const found = all.find((p) => p.providerId === defaultId);
    if (found) return found;
  }
  // 自动：按 autoOrder 顺序检测
  const order = getAutoOrder();
  for (const type of order as LlmProviderType[]) {
    const candidates = all.filter((p) => p.providerType === type);
    for (const cand of candidates) {
      const h = await checkProvider(cand);
      if (h.status === "READY") return cand;
    }
  }
  // 没有可用 Provider：返回第一个开启项作为最后尝试
  return all[0] || null;
}

export async function runLlmChat(opts: RunChatOptions): Promise<LlmRunResult> {
  const cfg = await resolveProvider(opts.providerId);
  if (!cfg) {
    const r: LlmRunResult = {
      runId: crypto.randomUUID(),
      providerId: "none",
      modelId: opts.modelId || "",
      status: "FALLBACK",
      text: "",
      qaStatus: "WARN",
      safetyNotes: ["没有可用的模型提供者，请前往「模型提供者」配置。"],
      createdAt: nowIso(),
    };
    saveResult(r);
    return r;
  }

  // 第一道：上下文脱敏（Full60 / Founder-only / Secret / Workspace Dump）
  const sanitized = sanitizeModelContext(opts.messages);
  const sanitizeNotes = summarizeSanitization(sanitized.report);
  // 第二道：Provider 级安全守卫（远程地址提醒等）
  const safety = applySafetyGuard(sanitized.messages, cfg);

  const req: LlmRunRequest = {
    runId: crypto.randomUUID(),
    providerId: cfg.providerId,
    modelId: opts.modelId || cfg.defaultModel || "",
    sourceModule: opts.sourceModule || "chat",
    taskType: opts.taskType || "chat",
    messages: safety.messages,
    temperature: opts.temperature ?? 0.7,
    maxTokens: opts.maxTokens,
    stream: opts.stream ?? true,
    createdAt: nowIso(),
  };

  // 优先尝试本地网关（仅对 OLLAMA 类型生效；失败时回落原生适配器）
  let result: LlmRunResult | null = null;
  if (cfg.providerType === "OLLAMA") {
    try {
      const { tryRunOllamaViaGateway } = await import(
        "@/lib/local-gateway/localGatewayOllamaAdapter"
      );
      result = await tryRunOllamaViaGateway(cfg, req);
    } catch {
      result = null;
    }
  }
  if (!result) {
    const adapter = getAdapter(cfg.providerType);
    result = await adapter.runChat(cfg, req, opts.handlers);
  }
  const merged: LlmRunResult = {
    ...result,
    safetyNotes: [...sanitizeNotes, ...safety.notes, ...result.safetyNotes],
  };
  saveResult(merged);
  return merged;
}

export async function describeActiveProvider(): Promise<{
  providerId: string;
  providerType: string;
  chineseName: string;
  modelId: string;
} | null> {
  const cfg = await resolveProvider();
  if (!cfg) return null;
  return {
    providerId: cfg.providerId,
    providerType: cfg.providerType,
    chineseName: cfg.chineseName,
    modelId: cfg.defaultModel || "",
  };
}
