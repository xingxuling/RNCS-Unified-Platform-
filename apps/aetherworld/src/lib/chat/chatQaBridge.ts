import { evaluateChatSafety, type ChatSafetyVerdict } from "./chatSafetyGuard";

export function runChatQa(raw: string): ChatSafetyVerdict {
  return evaluateChatSafety(raw);
}
