// AetherSeed Auto Training Executor · 日志存储（脱敏）
import { nextAutoTrainingId, type AutoTrainingLogEntry } from "./autoTrainingTypes";

const LOGS = new Map<string, AutoTrainingLogEntry[]>(); // key = runId

const SENSITIVE_PATTERNS: { re: RegExp; replacement: string }[] = [
  { re: /sk-[A-Za-z0-9_-]{10,}/g, replacement: "[REDACTED_SECRET]" },
  { re: /(?:password|token|secret|api[_-]?key)\s*[:=]\s*\S+/gi, replacement: "$&".replace(/.*/, "[REDACTED]") },
  { re: /Authorization:\s*Bearer\s+\S+/gi, replacement: "Authorization: Bearer [REDACTED]" },
  { re: /\bFull60\b[\s\S]{0,60}/gi, replacement: "[REDACTED_FULL60]" },
  { re: /Founder-only[\s\S]{0,60}/gi, replacement: "[REDACTED_FOUNDER_ONLY]" },
];

export function sanitizeLine(line: string): { line: string; redacted: boolean } {
  let out = line;
  let redacted = false;
  for (const { re, replacement } of SENSITIVE_PATTERNS) {
    if (re.test(out)) {
      out = out.replace(re, replacement);
      redacted = true;
    }
  }
  return { line: out, redacted };
}

export function appendLog(runId: string, stream: AutoTrainingLogEntry["stream"], raw: string): AutoTrainingLogEntry {
  const { line, redacted } = sanitizeLine(raw);
  const entry: AutoTrainingLogEntry = {
    id: nextAutoTrainingId("LOG"),
    runId,
    timestamp: new Date().toISOString(),
    stream,
    line,
    redacted,
  };
  const arr = LOGS.get(runId) ?? [];
  arr.push(entry);
  LOGS.set(runId, arr);
  return entry;
}

export function listLogs(runId: string): AutoTrainingLogEntry[] {
  return LOGS.get(runId) ?? [];
}

export function logSummary(runId: string, maxLines = 30): string {
  const arr = listLogs(runId);
  return arr.slice(-maxLines).map((l) => `[${l.stream}] ${l.line}`).join("\n");
}
