export { AUTHORITY_HIERARCHY, AUTHORITY_ORDER, compareAuthority, isHigherOrEqual, type AuthorityActor, type AuthorityRule } from "@/constants/constitution/authorityHierarchy";

import { AUTHORITY_HIERARCHY, type AuthorityActor } from "@/constants/constitution/authorityHierarchy";

export function getAuthorityRule(actor: AuthorityActor) {
  return AUTHORITY_HIERARCHY.find((r) => r.actor === actor);
}

export function canActorPerform(actor: AuthorityActor, action: "READ" | "WRITE" | "EXPORT" | "LOCK", target: string): boolean {
  const rule = getAuthorityRule(actor);
  if (!rule) return false;
  const list = action === "READ" ? rule.canRead : action === "WRITE" ? rule.canWrite : action === "EXPORT" ? rule.canExport : rule.canLock;
  if (list.includes("*")) return true;
  return list.some((p) => p === target || target.startsWith(p.replace(/\*$/, "")));
}
