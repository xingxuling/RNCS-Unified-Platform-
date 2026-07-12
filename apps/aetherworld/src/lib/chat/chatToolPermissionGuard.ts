// 工具权限闸门：白名单 + 危险参数检查 + 自动公开/部署/支付拦截。
import type { ChatToolCallRequest } from "./chatToolExecutionResult";

export const TOOL_WHITELIST = new Set<string>([
  "workspace.saveObject",
  "calendar.createTask",
  "codeSandbox.createRun",
  "appRuntime.createDraft",
  "store.openPackage",
  "social.createDraft",
]);

export interface PermissionDecision {
  allowed: boolean;
  needsConfirm: boolean;
  reason: string;
}

export function checkToolPermission(req: ChatToolCallRequest): PermissionDecision {
  if (!TOOL_WHITELIST.has(req.toolId)) {
    return { allowed: false, needsConfirm: false, reason: `工具「${req.toolId}」不在安全白名单内，已阻断。` };
  }

  const raw = JSON.stringify(req.args ?? {}).toLowerCase();

  // 危险关键字
  if (/(rm\s+-rf|shutdown|format\s+c:|sudo|\/etc\/passwd)/.test(raw)) {
    return { allowed: false, needsConfirm: false, reason: "参数中包含高危命令，已阻断。" };
  }

  // 社交：禁止 PUBLIC 自动发布
  if (req.toolId === "social.createDraft") {
    const vis = String((req.args as any)?.visibility ?? "PRIVATE").toUpperCase();
    if (vis !== "PRIVATE" && vis !== "UNLISTED") {
      return { allowed: false, needsConfirm: true, reason: "社交发布默认仅创建 PRIVATE 草稿，需人工确认才能公开。" };
    }
  }

  // 日历：要求显式时间
  if (req.toolId === "calendar.createTask") {
    const when = (req.args as any)?.when;
    if (!when || typeof when !== "string" || when.trim().length < 4) {
      return { allowed: false, needsConfirm: true, reason: "未提供明确时间，需补充后再创建提醒。" };
    }
  }

  // 应用 / 代码沙箱：不允许直接 deploy / publish / install 高权限
  if (/deploy|publish|install.*high|payment|charge/.test(raw)) {
    return { allowed: false, needsConfirm: true, reason: "涉及部署 / 公开发布 / 支付 / 高权限安装，需人工确认。" };
  }

  return { allowed: true, needsConfirm: false, reason: "通过权限闸门。" };
}
