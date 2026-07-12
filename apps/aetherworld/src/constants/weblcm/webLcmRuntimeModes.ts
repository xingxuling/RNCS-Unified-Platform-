export type WebLcmRuntimeMode =
  | "RULE_CONCEPT_ONLY"
  | "WEB_EMBEDDING_ASSISTED"
  | "HYBRID_AETHER_CONCEPT"
  | "WEBLCM_TO_WEBLLM"
  | "NO_EMBEDDING_FALLBACK";

export interface WebLcmRuntimeModeDef {
  id: WebLcmRuntimeMode;
  title: string;
  description: string;
}

export const WEB_LCM_RUNTIME_MODES: WebLcmRuntimeModeDef[] = [
  { id: "RULE_CONCEPT_ONLY",      title: "规则概念抽取",     description: "只使用 Aetherworld 规则层进行概念抽取，不调用 embedding。" },
  { id: "WEB_EMBEDDING_ASSISTED", title: "浏览器 Embedding", description: "使用浏览器端 embedding/semantic vector 辅助概念抽取与检索。" },
  { id: "HYBRID_AETHER_CONCEPT",  title: "混合概念运行时",   description: "规则 + embedding + 计算法结构 + QA。" },
  { id: "WEBLCM_TO_WEBLLM",       title: "WebLCM→WebLLM",   description: "WebLCM 生成概念链，再交给 WebLLM 展开为语言。" },
  { id: "NO_EMBEDDING_FALLBACK",  title: "无 Embedding 降级", description: "embedding 不可用时自动降级为规则概念抽取。" },
];

export const DEFAULT_WEB_LCM_RUNTIME_MODE: WebLcmRuntimeMode = "HYBRID_AETHER_CONCEPT";
