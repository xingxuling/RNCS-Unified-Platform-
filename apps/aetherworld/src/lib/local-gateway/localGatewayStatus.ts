// Aether Local Gateway 状态类型与持久化
// 仅前端使用，不直接执行 Shell；Gateway 真实进程位于 /local-gateway 模板包。

export type GatewayState =
  | "GATEWAY_READY"
  | "GATEWAY_OFFLINE"
  | "GATEWAY_ERROR";

export type OllamaState =
  | "OLLAMA_READY"
  | "OLLAMA_NOT_FOUND"
  | "OLLAMA_PORT_CHANGED"
  | "TERMINAL_OK_BROWSER_BLOCKED"
  | "MODEL_NOT_FOUND"
  | "UNKNOWN";

export interface LocalGatewayStatus {
  gateway: GatewayState;
  ollama: OllamaState;
  activeProvider: "ollama" | "webllm" | "none";
  activeBaseUrl: string;
  models: string[];
  version?: string;
  message?: string;
  checkedAt: string;
}

const URL_KEY = "aether.localGateway.url.v1";
const DEFAULT_URL = "http://localhost:18777";

export function getGatewayUrl(): string {
  if (typeof window === "undefined") return DEFAULT_URL;
  return localStorage.getItem(URL_KEY) || DEFAULT_URL;
}

export function setGatewayUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(URL_KEY, url.replace(/\/$/, ""));
  window.dispatchEvent(new CustomEvent("aether:localGateway:changed"));
}

export const DEFAULT_GATEWAY_URL = DEFAULT_URL;
