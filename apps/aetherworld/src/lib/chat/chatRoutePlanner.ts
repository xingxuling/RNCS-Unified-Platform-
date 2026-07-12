import type { ChatIntentResult } from "./chatIntentResolver";

export interface ChatRoutePlan {
  shouldAnswer: boolean;
  shouldOfferActions: boolean;
  shouldOpenPage: boolean;
  pageRoute?: string;
  shouldCallRuntime: boolean;
  shouldCreateObject: boolean;
  shouldRequireInstall: boolean;
}

const ASK_TYPES = new Set([
  "GENERAL_CHAT",
  "ASK_EXPLANATION",
  "ASK_ANALYSIS",
  "ASK_COMPARISON",
  "ASK_STRATEGY",
  "ASK_DIAGNOSIS",
  "ASK_HOW_TO",
  "ASK_CAPABILITY",
  "ASK_SYSTEM_STATUS",
]);

const ASK_TO_DO_TYPES = new Set([
  "ASK_TO_DO_PLANNING",
  "ASK_TO_DO_FEASIBILITY",
  "ASK_TO_DO_RECOMMENDATION",
]);

const OPEN_TYPES = new Set(["DO_OPEN", "OPEN_PAGE", "DO_INSTALL", "INSTALL_CAPABILITY"]);

export function planChatRoute(intent: ChatIntentResult): ChatRoutePlan {
  const mode = intent.inputMode;
  const t = intent.intentType;

  if (ASK_TYPES.has(t) || mode === "ASK_MODE") {
    return {
      shouldAnswer: true,
      shouldOfferActions: true,
      shouldOpenPage: false,
      shouldCallRuntime: false,
      shouldCreateObject: false,
      shouldRequireInstall: false,
    };
  }
  if (ASK_TO_DO_TYPES.has(t) || mode === "ASK_TO_DO_MODE") {
    return {
      shouldAnswer: true,
      shouldOfferActions: true,
      shouldOpenPage: false,
      shouldCallRuntime: false,
      shouldCreateObject: false,
      shouldRequireInstall: false,
    };
  }
  if (OPEN_TYPES.has(t)) {
    return {
      shouldAnswer: false,
      shouldOfferActions: true,
      shouldOpenPage: true,
      pageRoute: intent.pageRoute,
      shouldCallRuntime: false,
      shouldCreateObject: false,
      shouldRequireInstall: t === "DO_INSTALL" || t === "INSTALL_CAPABILITY",
    };
  }
  // DO / MIXED
  return {
    shouldAnswer: mode === "MIXED_MODE",
    shouldOfferActions: true,
    shouldOpenPage: false,
    shouldCallRuntime: true,
    shouldCreateObject: !!intent.targetObjectType,
    shouldRequireInstall: !!intent.requiredCapability,
  };
}
