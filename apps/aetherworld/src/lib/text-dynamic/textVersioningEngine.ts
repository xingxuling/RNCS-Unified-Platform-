// Text Versioning Engine — see spec §10
import { TEXT_REGISTRY } from "./textRegistry";

export interface TextVersion {
  versionId: string;
  version: string;
  createdAt: string;
  summary: string;
  changedTextIds: string[];
  triggerType?: string;
  relatedSystemVersion?: string;
  relatedConstantVersion?: string;
  relatedConstitutionVersion?: string;
  approvedBy?: string;
  snapshot: { textId: string; text: string }[];
}

const versions: TextVersion[] = [
  {
    versionId: "tv_init", version: "v1.0.0",
    createdAt: "2026-05-24T00:00:00Z",
    summary: "Text Dynamic Update Engine 初始化版本。",
    changedTextIds: TEXT_REGISTRY.map((x) => x.textId),
    approvedBy: "system",
    snapshot: TEXT_REGISTRY.map((x) => ({ textId: x.textId, text: x.currentText })),
  },
];

export function listVersions(): TextVersion[] {
  return versions.slice().reverse();
}

export function currentVersion(): TextVersion {
  return versions[versions.length - 1];
}

export function createVersion(opts: { version: string; summary: string; changedTextIds: string[]; triggerType?: string; approvedBy?: string }): TextVersion {
  const v: TextVersion = {
    versionId: `tv_${Date.now()}`,
    version: opts.version,
    createdAt: new Date().toISOString(),
    summary: opts.summary,
    changedTextIds: opts.changedTextIds,
    triggerType: opts.triggerType,
    approvedBy: opts.approvedBy,
    snapshot: TEXT_REGISTRY.map((x) => ({ textId: x.textId, text: x.currentText })),
  };
  versions.push(v);
  return v;
}

export function rollbackToVersion(versionId: string): { ok: boolean; restored: number; staleMarked: number } {
  const v = versions.find((x) => x.versionId === versionId);
  if (!v) return { ok: false, restored: 0, staleMarked: 0 };
  let restored = 0;
  for (const snap of v.snapshot) {
    const entry = TEXT_REGISTRY.find((x) => x.textId === snap.textId);
    if (entry && entry.currentText !== snap.text) {
      entry.currentText = snap.text;
      entry.stale = true;
      entry.staleReason = `Rolled back to ${v.version}`;
      restored += 1;
    }
  }
  return { ok: true, restored, staleMarked: restored };
}

export function compareVersions(aId: string, bId: string) {
  const a = versions.find((v) => v.versionId === aId);
  const b = versions.find((v) => v.versionId === bId);
  if (!a || !b) return { ok: false, diffs: [] as { textId: string; a: string; b: string }[] };
  const map = new Map(a.snapshot.map((s) => [s.textId, s.text]));
  const diffs: { textId: string; a: string; b: string }[] = [];
  for (const s of b.snapshot) {
    const av = map.get(s.textId) ?? "";
    if (av !== s.text) diffs.push({ textId: s.textId, a: av, b: s.text });
  }
  return { ok: true, diffs };
}
