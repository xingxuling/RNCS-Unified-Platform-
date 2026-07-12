// Aether Record Center · 持久化存储（localStorage 环形 buffer，容量 500）
import type { RecordEvent, RecordCenterStats, RecordQueryFilter, RecordEventType } from "./recordCenterTypes";

const STORAGE_KEY = "aether.recordCenter.events.v1";
const MAX_EVENTS = 500;

let memoryCache: RecordEvent[] | null = null;

function load(): RecordEvent[] {
  if (memoryCache) return memoryCache;
  if (typeof window === "undefined") {
    memoryCache = [];
    return memoryCache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    memoryCache = raw ? (JSON.parse(raw) as RecordEvent[]) : [];
  } catch {
    memoryCache = [];
  }
  return memoryCache;
}

function persist() {
  if (typeof window === "undefined" || !memoryCache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
  } catch {
    // 配额满或受限，静默忽略
  }
}

const listeners = new Set<() => void>();

export function subscribeRecordStore(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* noop */
    }
  });
}

export function appendEvent(ev: RecordEvent) {
  const list = load();
  list.unshift(ev);
  if (list.length > MAX_EVENTS) list.length = MAX_EVENTS;
  persist();
  notify();
}

export function listEvents(filter: RecordQueryFilter = {}): RecordEvent[] {
  const list = load();
  const now = Date.now();
  let out = list.filter((e) => {
    if (filter.eventType && filter.eventType !== "ALL" && e.eventType !== filter.eventType) return false;
    if (filter.status && filter.status !== "ALL" && e.status !== filter.status) return false;
    if (filter.safetyStatus && filter.safetyStatus !== "ALL" && e.safetyStatus !== filter.safetyStatus) return false;
    if (typeof filter.minImportance === "number" && e.importance < filter.minImportance) return false;
    if (filter.sinceMs) {
      const ts = Date.parse(e.createdAt);
      if (Number.isFinite(ts) && now - ts > filter.sinceMs) return false;
    }
    return true;
  });
  if (filter.limit && out.length > filter.limit) out = out.slice(0, filter.limit);
  return out;
}

export function getStats(): RecordCenterStats {
  const list = load();
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const byType: Partial<Record<RecordEventType, number>> = {};
  let today = 0;
  let highImportance = 0;
  let warnCount = 0;
  let blockCount = 0;
  let canVerifyCount = 0;
  for (const e of list) {
    byType[e.eventType] = (byType[e.eventType] || 0) + 1;
    const ts = Date.parse(e.createdAt);
    if (Number.isFinite(ts) && now - ts < dayMs) today++;
    if (e.importance >= 0.7) highImportance++;
    if (e.status === "WARN" || e.safetyStatus === "WARN") warnCount++;
    if (e.status === "BLOCKED" || e.safetyStatus === "BLOCK") blockCount++;
    if (e.canVerify) canVerifyCount++;
  }
  return { total: list.length, today, highImportance, warnCount, blockCount, byType, canVerifyCount };
}

export function clearAll() {
  memoryCache = [];
  persist();
  notify();
}
