import { DEFAULT_WEB_LCM_EMBEDDING_BACKEND, WEB_LCM_EMBEDDING_BACKENDS, type WebLcmEmbeddingBackend } from "@/constants/weblcm/webLcmEmbeddingBackends";

export interface WebLcmAvailability {
  ruleBackendAvailable: boolean;
  transformersJsAvailable: boolean;
  webllmEmbeddingAvailable: boolean;
  selectedBackend: WebLcmEmbeddingBackend;
  webGpuAvailable: boolean;
  notes: string[];
}

export async function detectWebLcmAvailability(): Promise<WebLcmAvailability> {
  const webGpuAvailable = typeof navigator !== "undefined" && "gpu" in navigator;
  let transformersJsAvailable = false;
  try {
    const mod: string = "@xenova/transformers";
    await import(/* @vite-ignore */ mod);
    transformersJsAvailable = true;
  } catch {
    transformersJsAvailable = false;
  }
  return {
    ruleBackendAvailable: true,
    transformersJsAvailable,
    webllmEmbeddingAvailable: false,
    selectedBackend: transformersJsAvailable ? "TRANSFORMERS_JS_EMBEDDING" : DEFAULT_WEB_LCM_EMBEDDING_BACKEND,
    webGpuAvailable,
    notes: [
      transformersJsAvailable ? "Transformers.js 已可用。" : "Transformers.js 未安装，使用规则后端。",
      webGpuAvailable ? "WebGPU 可用。" : "WebGPU 不可用，仅规则降级。",
      `共注册 ${WEB_LCM_EMBEDDING_BACKENDS.length} 个 embedding 后端。`,
    ],
  };
}
