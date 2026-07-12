import { checkChatCapability, type ChatCapabilityCheckResult } from "./chatCapabilityChecker";
import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";

export function checkWebXXMForChat(capabilityId: WebCapabilityId): ChatCapabilityCheckResult {
  return checkChatCapability(capabilityId);
}
