export const WEB_LLM_RUNTIME_MODES = [
  { id: "RULE_ONLY",              label: "仅规则层",          description: "只使用 Aetherworld 规则层，不调用 WebLLM。" },
  { id: "WEBLLM_ASSISTED",        label: "WebLLM 辅助",       description: "规则层生成结构，WebLLM 辅助语言/代码/剧情/歌词补全。" },
  { id: "HYBRID_AETHER_WEBLLM",   label: "混合（默认）",       description: "计算法结构 → WebLLM 补全 → 神经启发控制 → QA → 系统宪法。" },
  { id: "WEBLLM_DRAFT_ONLY",      label: "WebLLM 仅草案",      description: "WebLLM 只生成草案，不直接成为最终输出。" },
  { id: "NO_WEBGPU_FALLBACK",     label: "无 WebGPU 降级",     description: "浏览器不支持 WebGPU 或模型加载失败时，降级为规则层。" },
] as const;

export type WebLlmRuntimeModeId = typeof WEB_LLM_RUNTIME_MODES[number]["id"];
export const DEFAULT_WEB_LLM_RUNTIME_MODE: WebLlmRuntimeModeId = "HYBRID_AETHER_WEBLLM";
