// 世界记忆引擎 — localStorage 持久化
import type { VirtualWorldState } from "./virtualWorldEngine";

const KEY = "virtualWorldStates";

interface StoredMap { [worldId: string]: VirtualWorldState }

function read(): StoredMap {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(m: StoredMap) {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* quota */ }
}

export function saveWorldState(state: VirtualWorldState) {
  const m = read();
  m[state.worldId] = state;
  write(m);
}

export function loadWorldState(worldId: string): VirtualWorldState | null {
  return read()[worldId] ?? null;
}

export function loadAllWorldStates(): VirtualWorldState[] {
  return Object.values(read()).sort((a, b) =>
    (b.generatedAt || "").localeCompare(a.generatedAt || ""));
}

export function deleteWorldState(worldId: string) {
  const m = read();
  delete m[worldId];
  write(m);
}

export function deleteWorldsBySubject(subjectId: string) {
  const m = read();
  Object.keys(m).forEach(k => { if (m[k].subjectId === subjectId) delete m[k]; });
  write(m);
}

export function markStale(worldId: string) {
  const m = read();
  if (m[worldId]) {
    m[worldId].stale = true;
    write(m);
  }
}

export function markAllStale() {
  const m = read();
  Object.keys(m).forEach(k => { m[k].stale = true; });
  write(m);
}
