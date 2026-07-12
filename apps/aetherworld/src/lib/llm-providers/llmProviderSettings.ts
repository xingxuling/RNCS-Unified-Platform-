// 模型提供者设置持久化（localStorage）
import type { LlmProviderConfig, LlmProviderType } from "./llmProviderTypes";

const STORAGE_KEY = "aether.llmProviders.v1";
const DEFAULT_KEY = "aether.llmProviders.default.v1";
const AUTO_KEY = "aether.llmProviders.autoOrder.v1";

const nowIso = () => new Date().toISOString();

export function getDefaultProviders(): LlmProviderConfig[] {
  return [
    {
      providerId: "webllm-default",
      providerType: "WEBLLM",
      displayName: "WebLLM",
      chineseName: "浏览器本地模型",
      enabled: true,
      defaultModel: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
      supportsStreaming: true,
      supportsEmbeddings: false,
      supportsModelList: true,
      requestFormat: "WEBLLM",
      priority: 10,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      providerId: "ollama-local",
      providerType: "OLLAMA",
      displayName: "Ollama",
      chineseName: "本机 Ollama",
      enabled: true,
      baseUrl: "http://localhost:11434",
      defaultModel: "qwen2.5:8b",
      supportsStreaming: true,
      supportsEmbeddings: true,
      supportsModelList: true,
      requestFormat: "OLLAMA_NATIVE",
      priority: 20,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      providerId: "openai-compat-local",
      providerType: "OPENAI_COMPATIBLE_LOCAL",
      displayName: "OpenAI-Compatible Local",
      chineseName: "本地兼容接口",
      enabled: false,
      baseUrl: "http://localhost:8000/v1",
      defaultModel: "",
      supportsStreaming: true,
      supportsEmbeddings: false,
      supportsModelList: true,
      requestFormat: "OPENAI_CHAT_COMPLETIONS",
      priority: 30,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];
}

export function loadProviders(): LlmProviderConfig[] {
  if (typeof window === "undefined") return getDefaultProviders();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defs = getDefaultProviders();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defs));
      return defs;
    }
    return JSON.parse(raw) as LlmProviderConfig[];
  } catch {
    return getDefaultProviders();
  }
}

export function saveProviders(list: LlmProviderConfig[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("aether:llmProviders:changed"));
}

export function upsertProvider(cfg: LlmProviderConfig): void {
  const list = loadProviders();
  const idx = list.findIndex((p) => p.providerId === cfg.providerId);
  const next = { ...cfg, updatedAt: nowIso() };
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  saveProviders(list);
}

export function removeProvider(providerId: string): void {
  saveProviders(loadProviders().filter((p) => p.providerId !== providerId));
}

export function getDefaultProviderId(): string | "AUTO" {
  if (typeof window === "undefined") return "AUTO";
  return (localStorage.getItem(DEFAULT_KEY) as string) || "AUTO";
}

export function setDefaultProviderId(id: string | "AUTO"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEFAULT_KEY, id);
  window.dispatchEvent(new CustomEvent("aether:llmProviders:changed"));
}

export function getAutoOrder(): LlmProviderType[] {
  if (typeof window === "undefined")
    return ["WEBLLM", "OLLAMA", "OPENAI_COMPATIBLE_LOCAL", "VLLM", "LLAMA_CPP", "CUSTOM"];
  try {
    const raw = localStorage.getItem(AUTO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return ["WEBLLM", "OLLAMA", "OPENAI_COMPATIBLE_LOCAL", "VLLM", "LLAMA_CPP", "CUSTOM"];
}

export function setAutoOrder(order: LlmProviderType[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTO_KEY, JSON.stringify(order));
}
