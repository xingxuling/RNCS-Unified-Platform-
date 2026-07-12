// 极简 QA 桥接：在 Gateway 调用前做一次轻量校验，避免空 message 或异常体积。
import type { GatewayChatRequest } from "./aetherLocalGatewayClient";

export interface GatewayQaResult {
  ok: boolean;
  level: "PASS" | "WARN" | "BLOCK";
  notes: string[];
}

const MAX_MESSAGES = 200;
const MAX_CONTENT = 200 * 1024; // 200KB

export function qaGatewayChatRequest(req: GatewayChatRequest): GatewayQaResult {
  const notes: string[] = [];
  if (!req.model) return { ok: false, level: "BLOCK", notes: ["缺少模型 ID。"] };
  if (!Array.isArray(req.messages) || req.messages.length === 0)
    return { ok: false, level: "BLOCK", notes: ["消息为空。"] };
  if (req.messages.length > MAX_MESSAGES) {
    notes.push(`消息数量过多（${req.messages.length}），已建议截断。`);
  }
  const total = req.messages.reduce((s, m) => s + (m.content?.length || 0), 0);
  if (total > MAX_CONTENT) {
    return { ok: false, level: "BLOCK", notes: [`消息总长度过大（${total} bytes）。`] };
  }
  return { ok: true, level: notes.length ? "WARN" : "PASS", notes };
}
