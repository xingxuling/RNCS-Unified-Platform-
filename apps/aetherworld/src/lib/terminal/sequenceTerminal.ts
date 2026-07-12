import { parseTerminalCommand, type ParsedTerminalCommand } from "./terminalCommandParser";
import { checkPermission, type PermissionCheck } from "./terminalPermissionGuard";
import { checkSafety, describeTriggeredRules, type SafetyCheck } from "./terminalSafetyGuard";
import { executeTerminalCommand } from "./terminalExecutor";
import { isCommandAllowedInMode } from "@/constants/terminal/terminalModes";
import { appendTerminalHistory } from "./terminalHistory";
import type { TerminalSession } from "./terminalSessionManager";
import type { TerminalOutput } from "@/constants/terminal/terminalOutputTypes";

export interface RunTerminalResult {
  parsed: ParsedTerminalCommand;
  permission: PermissionCheck;
  safety: SafetyCheck;
  output: TerminalOutput;
}

export interface RunTerminalOptions {
  session: TerminalSession;
  onClear?: () => void;
  exportConfirmed?: boolean;
}

export function runSequenceTerminal(rawInput: string, opts: RunTerminalOptions): RunTerminalResult {
  const parsed = parseTerminalCommand(rawInput);

  if (!parsed.valid) {
    const output: TerminalOutput = {
      id: `out_${Date.now()}`,
      type: "ERROR",
      title: "无效命令",
      content: parsed.errors.join("\n") || "命令为空",
      createdAt: new Date().toISOString(),
      quickActions: ["help"],
    };
    return {
      parsed,
      permission: { allowed: false, required: "PUBLIC_READ", current: opts.session.permission },
      safety: { blocked: true, requireConfirm: false, notes: [], triggeredRules: [] },
      output,
    };
  }

  // Mode allow-list
  if (!isCommandAllowedInMode(opts.session.mode, parsed.command)) {
    const output: TerminalOutput = {
      id: `out_${Date.now()}`,
      type: "WARNING",
      title: "当前模式不允许该命令",
      content: `命令 \`${parsed.command}\` 不在 ${opts.session.mode} 允许列表中。请切换到 ENGINE_TERMINAL 或 FOUNDER_TERMINAL。`,
      createdAt: new Date().toISOString(),
      quickActions: ["help", "status"],
    };
    return {
      parsed,
      permission: { allowed: false, required: parsed.permissionRequired, current: opts.session.permission, reason: "当前模式限制" },
      safety: { blocked: true, requireConfirm: false, notes: [], triggeredRules: [] },
      output,
    };
  }

  // Permission
  const permission = checkPermission(parsed, opts.session.permission);
  if (!permission.allowed) {
    const output: TerminalOutput = {
      id: `out_${Date.now()}`,
      type: "ERROR",
      title: "Permission denied",
      content: `${permission.reason}\n\n${permission.hint ?? ""}`,
      createdAt: new Date().toISOString(),
      quickActions: ["help", "status", "terminal.permissions"],
    };
    return {
      parsed,
      permission,
      safety: { blocked: true, requireConfirm: false, notes: [], triggeredRules: [] },
      output,
    };
  }

  // Safety
  const safety = checkSafety(parsed, {
    subjectMode: opts.session.subjectMode,
    permission: opts.session.permission,
    full60Active: opts.session.full60Active,
    confirmed: opts.exportConfirmed,
  });

  if (safety.blocked) {
    const output: TerminalOutput = {
      id: `out_${Date.now()}`,
      type: "WARNING",
      title: "命令已被安全守卫拦截",
      content: [...safety.notes, ...describeTriggeredRules(safety.triggeredRules)].join("\n"),
      createdAt: new Date().toISOString(),
      safetyNotes: safety.notes,
    };
    return { parsed, permission, safety, output };
  }

  if (safety.requireConfirm) {
    const output: TerminalOutput = {
      id: `out_${Date.now()}`,
      type: "WARNING",
      title: "请二次确认",
      content: [...safety.notes, ...describeTriggeredRules(safety.triggeredRules), "", "在导出面板点击「确认导出」后重新执行此命令。"].join("\n"),
      createdAt: new Date().toISOString(),
      safetyNotes: safety.notes,
      quickActions: ["export last --format markdown"],
    };
    return { parsed, permission, safety, output };
  }

  // Execute
  const output = executeTerminalCommand(parsed, opts.session, { onClear: opts.onClear });
  if (safety.notes.length) {
    output.safetyNotes = [...(output.safetyNotes ?? []), ...safety.notes];
  }

  appendTerminalHistory({
    command: parsed.raw,
    outputSummary: output.title ?? output.type,
    mode: opts.session.mode,
    subjectMode: opts.session.subjectMode,
  });

  return { parsed, permission, safety, output };
}
