import type { CodeRunLog } from "./codeRunRequestEngine";

export function createLogger(source: string) {
  const logs: CodeRunLog[] = [];
  const push = (level: CodeRunLog["level"], message: string) => {
    logs.push({
      logId: `log-${logs.length}-${Math.random().toString(36).slice(2, 6)}`,
      level,
      message,
      source,
      timestamp: new Date().toISOString(),
    });
  };
  return {
    info: (m: string) => push("INFO", m),
    warn: (m: string) => push("WARN", m),
    error: (m: string) => push("ERROR", m),
    system: (m: string) => push("SYSTEM", m),
    logs,
  };
}
