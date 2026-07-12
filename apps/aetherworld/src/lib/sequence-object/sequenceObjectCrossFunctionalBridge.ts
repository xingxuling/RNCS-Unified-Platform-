// sequenceObjectCrossFunctionalBridge.ts
import type { SequenceObjectInterface } from "./sequenceObjectInterfaceEngine";
import type { SequenceObjectPermission } from "./sequenceObjectPermissionGuard";

export interface CrossFunctionalBridgeResult {
  allowed: boolean;
  level: "PASS" | "WARN" | "BLOCK";
  reason: string;
  payloadShape: { intent: string; objectId: string; targetEngine: string };
}

export function buildCrossFunctionalCall(
  objectId: string,
  iface: SequenceObjectInterface,
  permission: SequenceObjectPermission,
): CrossFunctionalBridgeResult {
  if (!iface.allowed) return { allowed: false, level: "BLOCK", reason: "接口未启用", payloadShape: { intent: "CROSS_USE", objectId, targetEngine: iface.targetEngine } };
  if (!permission.canCrossUse) return { allowed: false, level: "BLOCK", reason: "对象权限不允许跨域", payloadShape: { intent: "CROSS_USE", objectId, targetEngine: iface.targetEngine } };
  if (iface.transferableVariables.length === 0) return { allowed: true, level: "WARN", reason: "变量映射缺失", payloadShape: { intent: "CROSS_USE", objectId, targetEngine: iface.targetEngine } };
  return { allowed: true, level: "PASS", reason: "OK", payloadShape: { intent: "CROSS_USE", objectId, targetEngine: iface.targetEngine } };
}
