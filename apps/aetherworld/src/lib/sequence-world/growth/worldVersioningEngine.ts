export interface WorldVersion {
  versionId: string;
  worldId: string;
  version: string;
  createdAt: string;
  summary: string;
  changes: string[];
  snapshotId?: string;
  canonHash?: string;
  tag?: string;
}

const KEY = "aether.world.growth.versions.v1";

export function loadVersions(worldId?: string): WorldVersion[] {
  try {
    const v = localStorage.getItem(KEY);
    const all: WorldVersion[] = v ? JSON.parse(v) : [];
    return worldId ? all.filter(x => x.worldId === worldId) : all;
  } catch { return []; }
}

function save(arr: WorldVersion[]) {
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-200))); } catch {}
}

function nextVersion(prev?: string): string {
  if (!prev) return "v0.3.0";
  const m = prev.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return "v0.3.1";
  return `v${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

export function createVersion(opts: { worldId: string; summary: string; changes?: string[]; snapshotId?: string; canonHash?: string; tag?: string }): WorldVersion {
  const all = loadVersions(opts.worldId);
  const last = all[all.length - 1];
  const v: WorldVersion = {
    versionId: `ver-${Date.now().toString(36)}`,
    worldId: opts.worldId,
    version: nextVersion(last?.version),
    createdAt: new Date().toISOString(),
    summary: opts.summary,
    changes: opts.changes ?? [],
    snapshotId: opts.snapshotId,
    canonHash: opts.canonHash,
    tag: opts.tag,
  };
  save([...loadVersions(), v]);
  return v;
}

export function compareVersions(aId: string, bId: string) {
  const all = loadVersions();
  const a = all.find(v => v.versionId === aId); const b = all.find(v => v.versionId === bId);
  if (!a || !b) return null;
  return { fromVersion: a.version, toVersion: b.version, changes: b.changes };
}

export function rollbackVersion(versionId: string): WorldVersion | null {
  const all = loadVersions();
  const target = all.find(v => v.versionId === versionId);
  if (!target) return null;
  return createVersion({
    worldId: target.worldId,
    summary: `回滚到 ${target.version}`,
    changes: [`rollback:${target.version}`],
    snapshotId: target.snapshotId, canonHash: target.canonHash,
  });
}

export function tagVersion(versionId: string, tag: string): boolean {
  const all = loadVersions();
  const idx = all.findIndex(v => v.versionId === versionId);
  if (idx < 0) return false;
  all[idx] = { ...all[idx], tag };
  save(all);
  return true;
}

export function exportVersion(versionId: string): string {
  return JSON.stringify(loadVersions().find(v => v.versionId === versionId) ?? {}, null, 2);
}
