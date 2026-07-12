// 社交发布权限闸：QA + 敏感扫描 + 可见性
import type { SocialPublishInput } from "./socialTypes";
import { runSocialSafetyCheck } from "./socialSafetyGuard";
import { filterSocialContentForPublish } from "@/lib/security/socialSecretFilter";
import { checkVisibilityAllowed, detectSocialUserMode } from "./socialVisibilityGuard";

export interface PublishPermissionVerdict {
  allowed: boolean;
  forceVisibility?: SocialPublishInput["visibility"];
  blockedReasons: string[];
  warnings: string[];
  qaStatus: "PASS" | "WARN" | "BLOCKED";
  safetyStatus: "PASS" | "WARN" | "BLOCK";
}

export function evaluatePublishPermission(input: SocialPublishInput): PublishPermissionVerdict {
  const blockedReasons: string[] = [];
  const warnings: string[] = [];
  const text = `${input.title}\n${input.content}\n${(input.tags || []).join(" ")}`;

  // 1. 内容安全规则（Full60 / Founder-only / 危险命令等）
  const safety = runSocialSafetyCheck(text);
  if (!safety.ok) blockedReasons.push(...safety.risks.filter((r) => r.severity === "BLOCK").map((r) => r.message));
  warnings.push(...safety.risks.filter((r) => r.severity === "WARN").map((r) => r.message));

  // 2. Secret 扫描
  const secret = filterSocialContentForPublish(text);
  if (!secret.safe) blockedReasons.push(secret.reason || "包含高置信密钥 / Token。");
  if (secret.level === "WARN") warnings.push("内容包含疑似密钥字段，请确认。");

  // 3. 可见性权限
  const mode = detectSocialUserMode();
  const visibilityCheck = checkVisibilityAllowed(input.visibility, mode);

  const safetyStatus: PublishPermissionVerdict["safetyStatus"] = !secret.safe || !safety.ok ? "BLOCK" : warnings.length ? "WARN" : "PASS";
  const qaStatus: PublishPermissionVerdict["qaStatus"] = safetyStatus === "BLOCK" ? "BLOCKED" : safetyStatus === "WARN" ? "WARN" : "PASS";

  // PRIVATE 草稿允许带 WARN，但 BLOCK 仍不允许
  if (input.visibility === "PRIVATE") {
    return {
      allowed: blockedReasons.length === 0,
      blockedReasons,
      warnings,
      qaStatus,
      safetyStatus,
    };
  }

  // 非 PRIVATE：blockedReasons / 权限不通过 → 降级
  if (!visibilityCheck.allowed) {
    blockedReasons.push(visibilityCheck.reason || "可见性不允许。");
    return {
      allowed: false,
      forceVisibility: visibilityCheck.fallbackVisibility || "PRIVATE",
      blockedReasons,
      warnings,
      qaStatus,
      safetyStatus,
    };
  }

  return {
    allowed: blockedReasons.length === 0,
    forceVisibility: blockedReasons.length === 0 ? undefined : "PRIVATE",
    blockedReasons,
    warnings,
    qaStatus,
    safetyStatus,
  };
}
