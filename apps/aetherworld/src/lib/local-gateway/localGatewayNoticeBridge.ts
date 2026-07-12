// Notice 桥接：把 Gateway 事件统一转发到 toast / 系统通知（极简实现）。
import { toast } from "sonner";

export type GatewayNoticeKind =
  | "GATEWAY_OFFLINE"
  | "GATEWAY_CONNECTED"
  | "OLLAMA_DISCOVERED"
  | "OLLAMA_PORT_CHANGED"
  | "MODEL_NOT_FOUND"
  | "LOCAL_CALL_FAILED"
  | "FALLBACK_RULE_MODE";

const TEXT: Record<GatewayNoticeKind, string> = {
  GATEWAY_OFFLINE: "本地网关未启动，已回落 WebLLM / 规则模式。",
  GATEWAY_CONNECTED: "已通过本地网关连接 Ollama。",
  OLLAMA_DISCOVERED: "已自动发现本机 Ollama。",
  OLLAMA_PORT_CHANGED: "检测到 Ollama 端口已变更，已自动切换。",
  MODEL_NOT_FOUND: "当前默认模型不存在，请从已安装模型中选择。",
  LOCAL_CALL_FAILED: "本地模型调用失败。",
  FALLBACK_RULE_MODE: "已回落到规则模式以保证主链路可用。",
};

export function emitGatewayNotice(kind: GatewayNoticeKind, detail?: string): void {
  const msg = detail ? `${TEXT[kind]}（${detail}）` : TEXT[kind];
  switch (kind) {
    case "GATEWAY_CONNECTED":
    case "OLLAMA_DISCOVERED":
    case "OLLAMA_PORT_CHANGED":
      toast.success(msg);
      break;
    case "MODEL_NOT_FOUND":
    case "FALLBACK_RULE_MODE":
      toast.warning(msg);
      break;
    default:
      toast.error(msg);
  }
}
