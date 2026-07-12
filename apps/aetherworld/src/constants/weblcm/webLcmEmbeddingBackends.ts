export type WebLcmEmbeddingBackend =
  | "RULE_ONLY_BACKEND"
  | "TRANSFORMERS_JS_EMBEDDING"
  | "WEBLLM_EMBEDDING_ASSISTED"
  | "CUSTOM_BROWSER_EMBEDDING";

export interface WebLcmEmbeddingBackendDef {
  id: WebLcmEmbeddingBackend;
  title: string;
  description: string;
  available: boolean;
  notes: string;
}

export const WEB_LCM_EMBEDDING_BACKENDS: WebLcmEmbeddingBackendDef[] = [
  { id: "RULE_ONLY_BACKEND", title: "规则向量后端", available: true,
    description: "基于关键词 / tag / conceptType 编码的符号向量。",
    notes: "v0.4 默认可用；不需要任何外部依赖。" },
  { id: "TRANSFORMERS_JS_EMBEDDING", title: "Transformers.js", available: false,
    description: "预留 @xenova/transformers 浏览器端 embedding。",
    notes: "未安装。安装后可启用真实 embedding。" },
  { id: "WEBLLM_EMBEDDING_ASSISTED", title: "WebLLM 辅助摘要", available: false,
    description: "通过 WebLLM 先做摘要再向量化。",
    notes: "需要 WebLLM 模型加载完成。" },
  { id: "CUSTOM_BROWSER_EMBEDDING", title: "自定义浏览器 Embedding", available: false,
    description: "用户未来自定义浏览器 embedding 适配器。",
    notes: "需用户提供 adapter。" },
];

export const DEFAULT_WEB_LCM_EMBEDDING_BACKEND: WebLcmEmbeddingBackend = "RULE_ONLY_BACKEND";
