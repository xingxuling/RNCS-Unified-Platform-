import { checkCapabilityCallable, type CapabilityCallableReport } from "@/lib/webxxm-store/webXXMPackageRegistry";
import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";

export type ChatCapabilityCheckResult = CapabilityCallableReport & {
  callable: boolean;
};

export function checkChatCapability(capabilityId: WebCapabilityId): ChatCapabilityCheckResult {
  const r = checkCapabilityCallable(capabilityId);
  return { ...r, callable: r.installed && r.enabled };
}
