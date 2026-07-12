// 可见性闸 + 登录态/Demo 模式判定
import type { SocialVisibility } from "@/constants/social/socialVisibilityTypes";

export type SocialUserMode = "ANONYMOUS" | "DEMO" | "LOGGED_IN" | "FOUNDER";

export function detectSocialUserMode(): SocialUserMode {
  if (typeof window === "undefined") return "ANONYMOUS";
  try {
    const founderRaw = localStorage.getItem("aether.founder.state");
    if (founderRaw && founderRaw.includes("ACTIVE")) return "FOUNDER";
    const subjectMode = localStorage.getItem("aether.subject.mode") || "";
    if (subjectMode.includes("DEMO")) return "DEMO";
    const session = localStorage.getItem("sb-auth-token") || localStorage.getItem("supabase.auth.token");
    if (session) return "LOGGED_IN";
  } catch {}
  return "ANONYMOUS";
}

export interface VisibilityCheckResult {
  allowed: boolean;
  reason?: string;
  fallbackVisibility?: SocialVisibility;
}

export function checkVisibilityAllowed(
  requested: SocialVisibility,
  mode: SocialUserMode = detectSocialUserMode(),
): VisibilityCheckResult {
  if (requested === "PRIVATE") return { allowed: true };

  if (requested === "FOUNDER_ONLY") {
    if (mode === "FOUNDER") return { allowed: true };
    return { allowed: false, reason: "Founder 专属可见性仅 Founder 账号可发布。", fallbackVisibility: "PRIVATE" };
  }

  if (mode === "ANONYMOUS" || mode === "DEMO") {
    return {
      allowed: false,
      reason: "当前为 Demo / 本地模式，无法公开发布。你可以先保存为私密草稿。",
      fallbackVisibility: "PRIVATE",
    };
  }

  return { allowed: true };
}
