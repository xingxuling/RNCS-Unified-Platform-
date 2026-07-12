// 开源大语言模型 API 接入层 - 类型定义
export type LlmProviderType =
  | "WEBLLM"
  | "OLLAMA"
  | "OPENAI_COMPATIBLE_LOCAL"
  | "VLLM"
  | "LLAMA_CPP"
  | "CUSTOM";

export type LlmRequestFormat =
  | "WEBLLM"
  | "OLLAMA_NATIVE"
  | "OPENAI_CHAT_COMPLETIONS"
  | "OPENAI_RESPONSES"
  | "CUSTOM";

export type LlmHealthStatus =
  | "READY"
  | "UNREACHABLE"
  | "NO_MODEL"
  | "AUTH_REQUIRED"
  | "ERROR"
  | "UNSAFE_REMOTE"
  | "UNKNOWN";

export interface LlmProviderConfig {
  providerId: string;
  providerType: LlmProviderType;
  displayName: string;
  chineseName: string;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  defaultModel?: string;
  supportsStreaming: boolean;
  supportsEmbeddings: boolean;
  supportsModelList: boolean;
  supportsToolCalling?: boolean;
  requestFormat: LlmRequestFormat;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface LlmModelOption {
  modelId: string;
  displayName: string;
  providerId: string;
  parameterSize?: string;
  recommendedUse: string[];
  contextWindow?: number;
  localOnly: boolean;
  status: "AVAILABLE" | "INSTALLED" | "RUNNING" | "UNKNOWN";
}

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmRunRequest {
  runId: string;
  providerId: string;
  modelId: string;
  sourceModule: string;
  taskType: string;
  messages: LlmMessage[];
  temperature: number;
  maxTokens?: number;
  stream: boolean;
  createdAt: string;
}

export type LlmRunStatus =
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "BLOCKED"
  | "FALLBACK";

export interface LlmRunResult {
  runId: string;
  providerId: string;
  modelId: string;
  status: LlmRunStatus;
  text: string;
  rawResponse?: unknown;
  qaStatus: string;
  latencyMs?: number;
  safetyNotes: string[];
  createdAt: string;
}

export interface LlmStreamHandlers {
  onDelta?: (chunk: string) => void;
  onDone?: (result: LlmRunResult) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

export interface LlmProviderAdapter {
  type: LlmProviderType;
  healthCheck(cfg: LlmProviderConfig): Promise<{ status: LlmHealthStatus; latencyMs?: number; message?: string }>;
  listModels(cfg: LlmProviderConfig): Promise<LlmModelOption[]>;
  runChat(
    cfg: LlmProviderConfig,
    req: LlmRunRequest,
    handlers?: LlmStreamHandlers
  ): Promise<LlmRunResult>;
}
