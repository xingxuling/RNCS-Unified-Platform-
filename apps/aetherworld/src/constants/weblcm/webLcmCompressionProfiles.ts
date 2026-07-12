export type WebLcmCompressionProfile =
  | "MINIMAL_CORE" | "BALANCED" | "RICH_CONTEXT" | "WEBLLM_PROMPT_READY";

export const WEB_LCM_COMPRESSION_PROFILES: { id: WebLcmCompressionProfile; title: string; description: string; maxConcepts: number }[] = [
  { id: "MINIMAL_CORE",         title: "最小核心",    description: "只保留 1-3 个核心概念。",       maxConcepts: 3 },
  { id: "BALANCED",             title: "均衡",        description: "保留 4-7 个核心概念。",         maxConcepts: 7 },
  { id: "RICH_CONTEXT",         title: "丰富上下文",  description: "保留 8-15 个概念。",             maxConcepts: 15 },
  { id: "WEBLLM_PROMPT_READY",  title: "WebLLM 就绪", description: "为 WebLLM 优化的概念摘要密度。", maxConcepts: 10 },
];

export const DEFAULT_WEB_LCM_COMPRESSION_PROFILE: WebLcmCompressionProfile = "BALANCED";
