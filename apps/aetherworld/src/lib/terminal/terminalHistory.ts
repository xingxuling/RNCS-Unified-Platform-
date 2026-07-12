const HISTORY_KEY = "aether.terminal.history.v1";
const MAX_ENTRIES = 100;

export interface TerminalHistoryEntry {
  id: string;
  command: string;
  outputSummary: string;
  mode: string;
  subjectMode: string;
  createdAt: string;
}

function safeRead(): TerminalHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

function safeWrite(entries: TerminalHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // ignore quota
  }
}

export function appendTerminalHistory(entry: Omit<TerminalHistoryEntry, "id" | "createdAt">): TerminalHistoryEntry {
  const full: TerminalHistoryEntry = {
    ...entry,
    id: `term_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const arr = safeRead();
  arr.push(full);
  safeWrite(arr);
  return full;
}

export function getTerminalHistory(): TerminalHistoryEntry[] {
  return safeRead();
}

export function clearTerminalHistory(): void {
  safeWrite([]);
}

export function exportTerminalHistory(format: "json" | "markdown" = "markdown"): string {
  const arr = safeRead();
  if (format === "json") return JSON.stringify(arr, null, 2);
  return arr
    .map((e) => `- [${e.createdAt}] (${e.mode} / ${e.subjectMode}) \`${e.command}\` — ${e.outputSummary}`)
    .join("\n");
}
