export interface WorldEvolutionLog {
  id: string;
  worldId: string;
  tick?: number;
  actionType: string;
  actionSummary: string;
  source: "TICK" | "USER" | "MSL" | "FOUNDER" | "AUTO_REPAIR" | "IMPORT";
  affectedAssets: string[];
  createdAt: string;
  safetyNotes: string[];
}

const KEY = "aether.world.growth.evolutionLog.v1";

export function appendLog(entry: Omit<WorldEvolutionLog, "id" | "createdAt"> & { id?: string; createdAt?: string }): WorldEvolutionLog {
  const log: WorldEvolutionLog = {
    id: entry.id ?? `evo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    ...entry,
  };
  try {
    const all = loadLogs();
    all.push(log);
    localStorage.setItem(KEY, JSON.stringify(all.slice(-500)));
  } catch {}
  return log;
}

export function loadLogs(worldId?: string): WorldEvolutionLog[] {
  try {
    const v = localStorage.getItem(KEY);
    const arr: WorldEvolutionLog[] = v ? JSON.parse(v) : [];
    return worldId ? arr.filter(l => l.worldId === worldId) : arr;
  } catch { return []; }
}

export function searchLogs(query: string, worldId?: string): WorldEvolutionLog[] {
  const q = query.trim().toLowerCase();
  return loadLogs(worldId).filter(l =>
    !q || l.actionSummary.toLowerCase().includes(q) || l.actionType.toLowerCase().includes(q)
  );
}

export function exportLogs(worldId?: string): string {
  return JSON.stringify(loadLogs(worldId), null, 2);
}
