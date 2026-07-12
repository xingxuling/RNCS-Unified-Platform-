import { hasPermission, type TerminalPermissionLevel } from "@/constants/terminal/terminalPermissionLevels";
import type { ParsedTerminalCommand } from "./terminalCommandParser";

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  hint?: string;
  required: TerminalPermissionLevel;
  current: TerminalPermissionLevel;
}

export function checkPermission(
  parsed: ParsedTerminalCommand,
  currentPermission: TerminalPermissionLevel,
): PermissionCheck {
  const required = parsed.permissionRequired;
  if (hasPermission(currentPermission, required)) {
    return { allowed: true, required, current: currentPermission };
  }
  const reason = `Permission denied：当前命令需要 ${required}，当前权限为 ${currentPermission}。`;
  const hint =
    required === "FOUNDER"
      ? "请前往 Founder Gate 解锁 Founder Mode，或改用只读命令。"
      : "请升级到高阶模式，或改用 help 查看可用命令。";
  return { allowed: false, reason, hint, required, current: currentPermission };
}
