import { getCommandNames } from "./terminalCommandRegistry";
import { findCommand } from "@/constants/terminal/terminalCommands";
import { getTerminalHistory } from "./terminalHistory";

export interface AutocompleteSuggestion {
  value: string;
  hint?: string;
  source: "command" | "flag-value" | "history" | "example";
}

export function autocomplete(input: string): AutocompleteSuggestion[] {
  const trimmed = input.trimStart();
  if (!trimmed) return [];

  const tokens = trimmed.split(/\s+/);

  // Flag value completion: e.g. "compile 55555 --to "
  let lastDoubleDashIdx = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].startsWith("--")) { lastDoubleDashIdx = i; break; }
  }
  if (lastDoubleDashIdx >= 0 && lastDoubleDashIdx === tokens.length - 2 && !tokens[tokens.length - 1].startsWith("--")) {
    // tokens[last] is the value being typed
    const flagName = tokens[lastDoubleDashIdx].slice(2);
    const def = findCommand(tokens[0]);
    const flag = def?.flags?.find((f) => f.name === flagName);
    if (flag?.values) {
      const typed = tokens[tokens.length - 1];
      return flag.values
        .filter((v) => v.startsWith(typed))
        .map((v) => ({ value: v, source: "flag-value" as const, hint: `--${flagName}` }));
    }
  }
  // Flag value completion right after "--flag" with trailing space
  if (input.endsWith(" ") && tokens[tokens.length - 1].startsWith("--")) {
    const flagName = tokens[tokens.length - 1].slice(2);
    const def = findCommand(tokens[0]);
    const flag = def?.flags?.find((f) => f.name === flagName);
    if (flag?.values) {
      return flag.values.map((v) => ({ value: v, source: "flag-value" as const, hint: `--${flagName}` }));
    }
  }

  // Command name completion (first token)
  if (tokens.length === 1 && !input.endsWith(" ")) {
    const first = tokens[0];
    const cmds = getCommandNames().filter((c) => c.startsWith(first));
    const history = getTerminalHistory()
      .slice(-20)
      .map((h) => h.command)
      .filter((c) => c.startsWith(first));

    const seen = new Set<string>();
    const out: AutocompleteSuggestion[] = [];
    for (const c of cmds) {
      if (!seen.has(c)) {
        seen.add(c);
        out.push({ value: c, source: "command", hint: findCommand(c)?.description });
      }
    }
    for (const h of history) {
      if (!seen.has(h)) {
        seen.add(h);
        out.push({ value: h, source: "history" });
      }
    }
    return out.slice(0, 10);
  }

  return [];
}
