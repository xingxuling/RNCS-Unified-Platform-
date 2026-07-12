// 联网权限闸：v0.1 只允许只读读取，写入动作进入 WAITING_CONFIRMATION 流程

import type { NetworkReadPurpose } from "./aetherNetworkTypes";

export type NetworkAction =
  | "READ_URL"
  | "SEARCH_WEB"
  | "SUBMIT_FORM"
  | "AUTO_LOGIN"
  | "AUTO_INSTALL"
  | "AUTO_RUN_CODE"
  | "AUTO_PUBLISH"
  | "PAY"
  | "GITHUB_WRITE";

export interface NetworkPermissionDecision {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason: string;
}

export function checkNetworkAction(
  action: NetworkAction,
  _purpose?: NetworkReadPurpose,
): NetworkPermissionDecision {
  switch (action) {
    case "READ_URL":
      return { allowed: true, requiresConfirmation: false, reason: "v0.1 允许只读 URL" };
    case "SEARCH_WEB":
      return { allowed: false, requiresConfirmation: true, reason: "搜索引擎接入未启用，需用户确认或粘贴 URL" };
    case "SUBMIT_FORM":
    case "AUTO_LOGIN":
    case "AUTO_INSTALL":
    case "AUTO_RUN_CODE":
    case "AUTO_PUBLISH":
    case "PAY":
    case "GITHUB_WRITE":
      return { allowed: false, requiresConfirmation: true, reason: `v0.1 禁止 ${action}，需进入 Scheduler WAITING_CONFIRMATION` };
    default:
      return { allowed: false, requiresConfirmation: true, reason: "未知动作，默认拒绝" };
  }
}
