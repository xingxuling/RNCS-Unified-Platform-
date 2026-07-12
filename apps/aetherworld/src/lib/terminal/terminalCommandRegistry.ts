import { TERMINAL_COMMANDS, type CommandDefinition } from "@/constants/terminal/terminalCommands";

export function getAllCommands(): CommandDefinition[] {
  return [...TERMINAL_COMMANDS];
}

export function getCommandsByNamespace(ns: string): CommandDefinition[] {
  return TERMINAL_COMMANDS.filter((c) => (c.namespace ?? c.command.split(".")[0]) === ns);
}

export function getCommandNames(): string[] {
  return TERMINAL_COMMANDS.map((c) => c.command);
}

export function getEngineRegistry(): { engine: string; commands: string[] }[] {
  const map = new Map<string, string[]>();
  for (const c of TERMINAL_COMMANDS) {
    const arr = map.get(c.targetEngine) ?? [];
    arr.push(c.command);
    map.set(c.targetEngine, arr);
  }
  return Array.from(map.entries()).map(([engine, commands]) => ({ engine, commands }));
}
