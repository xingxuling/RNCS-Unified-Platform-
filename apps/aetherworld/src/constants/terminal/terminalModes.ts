export type TerminalMode =
  | "BASIC_TERMINAL"
  | "MSL_TERMINAL"
  | "ENGINE_TERMINAL"
  | "FOUNDER_TERMINAL"
  | "SAFE_READONLY_TERMINAL";

export interface TerminalModeDef {
  id: TerminalMode;
  label: string;
  labelEn: string;
  description: string;
  allowedCommands: string[]; // "*" = all
}

export const TERMINAL_MODES: TerminalModeDef[] = [
  {
    id: "BASIC_TERMINAL",
    label: "基础终端",
    labelEn: "Basic",
    description: "可运行 help / explain / parse / ask / search / example。",
    allowedCommands: ["help", "clear", "history", "status", "explain", "parse", "ask", "knowledge.search", "encyclopedia.search", "example"],
  },
  {
    id: "MSL_TERMINAL",
    label: "MSL 终端",
    labelEn: "MSL",
    description: "运行母体数列语言命令：parse / explain / block / run / compile。",
    allowedCommands: ["help", "clear", "history", "status", "parse", "explain", "block", "run", "compile"],
  },
  {
    id: "ENGINE_TERMINAL",
    label: "引擎终端",
    labelEn: "Engine",
    description: "调用所有引擎命令：model / world / narrative / vocal / translate / qa / recalc。",
    allowedCommands: ["*"],
  },
  {
    id: "FOUNDER_TERMINAL",
    label: "创始人终端",
    labelEn: "Founder",
    description: "运行 founder.* / engine.audit / system.audit / knowledge.lock / export.full 等高权限命令。",
    allowedCommands: ["*"],
  },
  {
    id: "SAFE_READONLY_TERMINAL",
    label: "只读终端",
    labelEn: "Read-only",
    description: "Demo / 普通用户只读模式，禁止写入与私有导出。",
    allowedCommands: ["help", "clear", "history", "status", "explain", "parse", "knowledge.search", "encyclopedia.search"],
  },
];

export function isCommandAllowedInMode(mode: TerminalMode, command: string): boolean {
  const def = TERMINAL_MODES.find((m) => m.id === mode);
  if (!def) return false;
  if (def.allowedCommands.includes("*")) return true;
  return def.allowedCommands.includes(command);
}
