/**
 * 路由可见性规则
 */
import type { UserMode } from "./routeGroups";

export const VISIBILITY_RULES = {
  /** 普通用户最多看到 PUBLIC */
  PUBLIC_LIMIT: ["PUBLIC"] as UserMode[],
  /** 高阶用户能看到 PUBLIC + ADVANCED */
  ADVANCED_LIMIT: ["PUBLIC", "ADVANCED"] as UserMode[],
  /** Founder 能看到全部 */
  FOUNDER_LIMIT: ["PUBLIC", "ADVANCED", "FOUNDER"] as UserMode[],
} as const;

export function allowedModesFor(userMode: UserMode): UserMode[] {
  if (userMode === "FOUNDER") return VISIBILITY_RULES.FOUNDER_LIMIT.slice();
  if (userMode === "ADVANCED") return VISIBILITY_RULES.ADVANCED_LIMIT.slice();
  return VISIBILITY_RULES.PUBLIC_LIMIT.slice();
}
