import { findCommand, TERMINAL_COMMANDS, type CommandDefinition } from "@/constants/terminal/terminalCommands";
import type { TerminalPermissionLevel } from "@/constants/terminal/terminalPermissionLevels";

export interface ParsedTerminalCommand {
  raw: string;
  command: string;
  namespace?: string;
  args: string[];
  flags: Record<string, string | boolean>;
  quotedText?: string;
  targetEngine?: string;
  permissionRequired: TerminalPermissionLevel;
  valid: boolean;
  errors: string[];
  resolvedDefinition?: CommandDefinition;
  autoTransformedFrom?: string;
}

// Tokenize respecting "double quotes"
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    tokens.push(m[1] !== undefined ? `"${m[1]}"` : m[2]);
  }
  return tokens;
}

function isPureSequence(s: string): boolean {
  return /^\d{5}$/.test(s.trim());
}

function isNaturalLanguage(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return false;
  if (TERMINAL_COMMANDS.some((c) => trimmed === c.command || trimmed.startsWith(c.command + " "))) return false;
  if (isPureSequence(trimmed)) return false;
  // Heuristic: contains CJK or ends with ? / 吗 / 。 / a space + multiple words
  if (/[\u4e00-\u9fff]/.test(trimmed)) return true;
  if (/[?？]\s*$/.test(trimmed)) return true;
  // If first token doesn't look like a command name
  const firstToken = trimmed.split(/\s+/)[0];
  if (!/^[a-zA-Z][a-zA-Z0-9.]*$/.test(firstToken)) return true;
  return false;
}

export function parseTerminalCommand(rawInput: string): ParsedTerminalCommand {
  const raw = rawInput;
  const errors: string[] = [];
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return { raw, command: "", args: [], flags: {}, permissionRequired: "PUBLIC_READ", valid: false, errors: ["命令为空"] };
  }

  // 1) 纯五位数列 → explain
  if (isPureSequence(trimmed)) {
    const def = findCommand("explain")!;
    return {
      raw,
      command: "explain",
      args: [trimmed],
      flags: {},
      targetEngine: def.targetEngine,
      permissionRequired: def.requiredPermission,
      valid: true,
      errors: [],
      resolvedDefinition: def,
      autoTransformedFrom: trimmed,
    };
  }

  // 2) 自然语言 → ask
  if (isNaturalLanguage(trimmed)) {
    const def = findCommand("ask")!;
    return {
      raw,
      command: "ask",
      args: [],
      flags: {},
      quotedText: trimmed,
      targetEngine: def.targetEngine,
      permissionRequired: def.requiredPermission,
      valid: true,
      errors: [],
      resolvedDefinition: def,
      autoTransformedFrom: trimmed,
    };
  }

  const tokens = tokenize(trimmed);
  const command = tokens[0];
  const def = findCommand(command);

  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let quotedText: string | undefined;

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith('"') && t.endsWith('"')) {
      quotedText = t.slice(1, -1);
    } else if (t.startsWith("--")) {
      const key = t.slice(2);
      const next = tokens[i + 1];
      if (next && !next.startsWith("--")) {
        const val = next.startsWith('"') && next.endsWith('"') ? next.slice(1, -1) : next;
        flags[key] = val;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      args.push(t);
    }
  }

  if (!def) {
    errors.push(`未识别的命令：${command}。输入 help 查看所有命令。`);
    return {
      raw, command, args, flags, quotedText,
      permissionRequired: "PUBLIC_READ",
      valid: false, errors,
    };
  }

  const namespace = def.namespace ?? command.split(".")[0];

  return {
    raw,
    command,
    namespace,
    args,
    flags,
    quotedText,
    targetEngine: def.targetEngine,
    permissionRequired: def.requiredPermission,
    valid: true,
    errors: [],
    resolvedDefinition: def,
  };
}
