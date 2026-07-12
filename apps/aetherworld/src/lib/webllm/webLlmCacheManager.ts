/**
 * Cache manager placeholder — surfaces a UI-friendly summary for the cached
 * WebLLM models. Real cache lives in the browser (Cache API / OPFS) and is
 * managed by @mlc-ai/web-llm once installed.
 */
export interface WebLlmCacheSummary {
  cachedModels: string[];
  estimatedSizeMb: number;
  message: string;
}

export function getCacheSummary(): WebLlmCacheSummary {
  return {
    cachedModels: [],
    estimatedSizeMb: 0,
    message: "WebLLM 缓存由浏览器管理；首次加载模型后会出现在此处（待 package 安装后接通）。",
  };
}

export function clearCache(): { ok: boolean; message: string } {
  return { ok: true, message: "占位：缓存清理将在接入 WebLLM package 后启用。" };
}
