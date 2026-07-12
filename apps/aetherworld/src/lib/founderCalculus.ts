// Founder Calculus — decides whether the current context may enter Founder Mode.

import type { FounderRole } from "@/constants/founderRoles";
import { isFounderPasswordSet } from "./founderPasswordCalculus";
import { isSessionActive } from "./founderSessionManager";

export interface FounderAccessContext {
  isFounderModeEnabled: boolean;
  hasFounderSession: boolean;
  passwordVerified: boolean;
  deviceTrusted: boolean;
  lastVerifiedAt?: string;
  currentUserType: string;
  currentClientProfile: string;
  requestedModule: string;
  requestedAction: string;
}

export interface FounderAccessResult {
  canEnterFounderMode: boolean;
  accessLevel: FounderRole;
  reason: string;
  requiredStep?: "SETUP_PASSWORD" | "ENTER_PASSWORD" | "RENEW_SESSION";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export function evaluateFounderAccess(ctx: Partial<FounderAccessContext> = {}): FounderAccessResult {
  const passwordSet = isFounderPasswordSet();
  const sessionActive = isSessionActive();

  if (!passwordSet) {
    return {
      canEnterFounderMode: false,
      accessLevel: "NONE",
      reason: "尚未设置本地创始人口令",
      requiredStep: "SETUP_PASSWORD",
      riskLevel: "MEDIUM",
    };
  }
  if (!sessionActive) {
    return {
      canEnterFounderMode: false,
      accessLevel: "NONE",
      reason: "创始人会话已过期或未登录",
      requiredStep: "ENTER_PASSWORD",
      riskLevel: "MEDIUM",
    };
  }
  return {
    canEnterFounderMode: true,
    accessLevel: "OWNER",
    reason: "创始人模式已激活",
    riskLevel: "LOW",
  };
}

export function currentFounderRole(): FounderRole {
  if (isFounderPasswordSet() && isSessionActive()) return "OWNER";
  return "NONE";
}

export function isFounderActive(): boolean {
  return currentFounderRole() === "OWNER";
}
