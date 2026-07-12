// World Simulation Logger
export interface WorldSimulationLog {
  id: string;
  worldId: string;
  tick: number;
  action: string;
  result: string;
  enginesUsed: string[];
  safetyNotes: string[];
  createdAt: string;
}

const STORE_KEY = "aether.world.sim.logs.v1";

export function appendLog(entry: Omit<WorldSimulationLog, "id" | "createdAt">) {
  const all = loadLogs();
  const log: WorldSimulationLog = {
    ...entry,
    id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [...all, log].slice(-500);
  try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch {}
  return log;
}
export function loadLogs(): WorldSimulationLog[] {
  try { const v = localStorage.getItem(STORE_KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}
export function clearLogs() { try { localStorage.removeItem(STORE_KEY); } catch {} }
export function searchLogs(q: string) {
  const ql = q.toLowerCase();
  return loadLogs().filter(l => l.action.toLowerCase().includes(ql) || l.result.toLowerCase().includes(ql));
}
