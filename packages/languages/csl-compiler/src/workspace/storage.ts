// CSL Workspace — localStorage 存储层
// MVP-2 Phase 6
//
// 键空间(全部前缀 csl:):
//   csl:meta                  — StorageMeta
//   csl:workspace:index       — WorkspaceIndex
//   csl:workspace:{id}        — Workspace
//   csl:snapshot:{id}         — DiagnosticSnapshot
//   csl:recent                — RecentEntry[]
//
// 容量保护:
//   - 写失败(quota)降级为内存模式 + 抛 StorageError
//   - 调用方负责给用户提示
//
// 纪律:不在这里做业务校验,只做读写 + schema 边界保护。

import {
  WORKSPACE_SCHEMA_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
  META_SCHEMA_VERSION,
  MAX_RECENT_ENTRIES,
  MAX_SNAPSHOTS_PER_WORKSPACE,
  type Workspace,
  type DiagnosticSnapshot,
  type RecentEntry,
  type WorkspaceIndex,
  type StorageMeta,
} from './types';

const K = {
  meta: 'csl:meta',
  index: 'csl:workspace:index',
  workspace: (id: string) => `csl:workspace:${id}`,
  snapshot: (id: string) => `csl:snapshot:${id}`,
  recent: 'csl:recent',
};

export class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

/** 安全 JSON 读 — 失败返回 null,不抛 */
function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 安全 JSON 写 — quota 失败抛 StorageError */
function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    throw new StorageError(`localStorage 写入失败:${key}(可能已超出配额)`, e);
  }
}

function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// ---------- 元数据 ----------

export function loadMeta(): StorageMeta {
  const m = readJSON<StorageMeta>(K.meta);
  if (m && m.schemaVersion === META_SCHEMA_VERSION) return m;
  // 首次启动或 schema 不一致 — 重置元数据(MVP 不做迁移)
  const fresh: StorageMeta = { schemaVersion: META_SCHEMA_VERSION, lastMigrationAt: null };
  try { writeJSON(K.meta, fresh); } catch { /* 忽略 */ }
  return fresh;
}

// ---------- 工作区索引 ----------

export function loadIndex(): WorkspaceIndex {
  const idx = readJSON<WorkspaceIndex>(K.index);
  if (idx && Array.isArray(idx.ids)) return idx;
  return { schemaVersion: WORKSPACE_SCHEMA_VERSION, ids: [], activeId: null };
}

export function saveIndex(idx: WorkspaceIndex): void {
  writeJSON(K.index, idx);
}

// ---------- 工作区 ----------

export function loadWorkspace(id: string): Workspace | null {
  const w = readJSON<Workspace>(K.workspace(id));
  if (!w) return null;
  // P2: 兼容 v1 (无 lockState/origin) → 自动补默认 + 升级
  if (w.schemaVersion === 1) {
    w.schemaVersion = WORKSPACE_SCHEMA_VERSION;
    w.lockState = w.lockState ?? 'editable';
    w.origin = w.origin ?? { kind: 'local' };
  }
  if (w.schemaVersion !== WORKSPACE_SCHEMA_VERSION) {
    console.warn(`[csl:workspace] schema 不匹配,跳过 ${id}`);
    return null;
  }
  return w;
}

export function saveWorkspace(w: Workspace): void {
  w.updatedAt = new Date().toISOString();
  writeJSON(K.workspace(w.id), w);
}

export function deleteWorkspace(id: string): void {
  // 同时清掉关联快照
  const w = loadWorkspace(id);
  if (w) {
    for (const sid of w.snapshotIds) safeRemove(K.snapshot(sid));
  }
  safeRemove(K.workspace(id));
  // 维护索引
  const idx = loadIndex();
  idx.ids = idx.ids.filter(x => x !== id);
  if (idx.activeId === id) idx.activeId = idx.ids[0] ?? null;
  saveIndex(idx);
  // 维护最近打开
  saveRecent(loadRecent().filter(r => r.workspaceId !== id));
}

export function listWorkspaces(): Workspace[] {
  const idx = loadIndex();
  const result: Workspace[] = [];
  for (const id of idx.ids) {
    const w = loadWorkspace(id);
    if (w) result.push(w);
  }
  return result;
}

// ---------- 快照 ----------

export function loadSnapshot(id: string): DiagnosticSnapshot | null {
  const s = readJSON<DiagnosticSnapshot>(K.snapshot(id));
  if (!s || s.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) return null;
  return s;
}

export function saveSnapshot(snap: DiagnosticSnapshot): void {
  writeJSON(K.snapshot(snap.id), snap);
  // 维护工作区的 snapshotIds(LRU,超上限淘汰最旧)
  const w = loadWorkspace(snap.workspaceId);
  if (!w) return;
  if (!w.snapshotIds.includes(snap.id)) {
    w.snapshotIds.push(snap.id);
  }
  while (w.snapshotIds.length > MAX_SNAPSHOTS_PER_WORKSPACE) {
    const oldest = w.snapshotIds.shift();
    if (oldest) safeRemove(K.snapshot(oldest));
  }
  saveWorkspace(w);
}

export function deleteSnapshot(snapshotId: string): void {
  const s = loadSnapshot(snapshotId);
  safeRemove(K.snapshot(snapshotId));
  if (s) {
    const w = loadWorkspace(s.workspaceId);
    if (w) {
      w.snapshotIds = w.snapshotIds.filter(x => x !== snapshotId);
      saveWorkspace(w);
    }
  }
}

export function listSnapshots(workspaceId: string): DiagnosticSnapshot[] {
  const w = loadWorkspace(workspaceId);
  if (!w) return [];
  return w.snapshotIds
    .map(id => loadSnapshot(id))
    .filter((x): x is DiagnosticSnapshot => x !== null);
}

// ---------- 最近打开 ----------

export function loadRecent(): RecentEntry[] {
  return readJSON<RecentEntry[]>(K.recent) ?? [];
}

export function saveRecent(list: RecentEntry[]): void {
  writeJSON(K.recent, list.slice(0, MAX_RECENT_ENTRIES));
}

export function pushRecent(entry: RecentEntry): void {
  const list = loadRecent().filter(r => r.workspaceId !== entry.workspaceId);
  list.unshift(entry);
  saveRecent(list);
}

/** P6: 重新打开/转换工作区后,清理 recent 中已不存在的引用 */
export function pruneRecentAgainstIndex(): void {
  const idx = loadIndex();
  const valid = new Set(idx.ids);
  const list = loadRecent().filter(r => valid.has(r.workspaceId));
  saveRecent(list);
}
