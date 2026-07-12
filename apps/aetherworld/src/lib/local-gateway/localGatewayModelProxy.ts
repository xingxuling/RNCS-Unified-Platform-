// 统一模型代理：优先走本地网关；失败时返回 ok=false，由上层回落到 WebLLM / 规则模式。
import { sanitizeModelContext } from "@/lib/security/modelContextSanitizer";
import {
  chatViaGateway,
  pingGateway,
  type GatewayChatMessage,
} from "./aetherLocalGatewayClient";
import { qaGatewayChatRequest } from "./localGatewayQaBridge";
import { emitGatewayNotice } from "./localGatewayNoticeBridge";

export interface ProxyChatOptions {
  model: string;
  messages: GatewayChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ProxyChatResult {
  ok: boolean;
  content: string;
  source?: string;
  safetyNotes: string[];
  error?: string;
}

export async function runChatViaGatewayProxy(
  opts: ProxyChatOptions,
): Promise<ProxyChatResult> {
  // 1. Gateway 探活
  const alive = await pingGateway();
  if (!alive) {
    return {
      ok: false,
      content: "",
      safetyNotes: ["本地网关未启动。"],
      error: "GATEWAY_OFFLINE",
    };
  }

  // 2. 上下文脱敏（与 LlmProviderRuntime 同一规则）
  const sanitized = sanitizeModelContext(opts.messages);

  // 3. QA 校验
  const qa = qaGatewayChatRequest({
    model: opts.model,
    messages: sanitized.messages,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
  });
  if (!qa.ok) {
    return { ok: false, content: "", safetyNotes: qa.notes, error: "QA_BLOCK" };
  }

  // 4. 转发到 Gateway
  try {
    const r = await chatViaGateway({
      model: opts.model,
      messages: sanitized.messages,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
    });
    return {
      ok: true,
      content: r.content || "",
      source: r.source,
      safetyNotes: [...qa.notes, ...(r.safetyNotes || [])],
    };
  } catch (e) {
    emitGatewayNotice("LOCAL_CALL_FAILED", e instanceof Error ? e.message : undefined);
    return {
      ok: false,
      content: "",
      safetyNotes: qa.notes,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
