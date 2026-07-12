/**
 * Lovable Native QA Bridge
 *
 * 让 Lovable 原生能力的输出（Build URL / AI 调用 / Connector 测试等）
 * 走与其它 ChatDisplayResult 一致的 QA 状态映射。
 */
import type { ChatDisplayResultQa } from "@/lib/chat/chatDisplayResultTypes";

export interface LovableQaInput {
  hasSafetyNotes?: boolean;
  hasError?: boolean;
  blocked?: boolean;
}

export function qaStatusFromLovable(input: LovableQaInput): ChatDisplayResultQa {
  if (input.blocked) return "BLOCKED";
  if (input.hasError) return "FAIL";
  if (input.hasSafetyNotes) return "WARN";
  return "PASS";
}
