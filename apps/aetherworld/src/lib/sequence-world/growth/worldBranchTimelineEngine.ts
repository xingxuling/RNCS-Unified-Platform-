import type { WorldTimelinePhase } from "@/constants/sequence-world/growth/worldTimelineTypes";

export interface WorldBranchTimeline {
  timelineId: string;
  worldId: string;
  name: string;
  branchPointTick: number;
  branchReason: string;
  parentTimelineId?: string;
  currentPhase: WorldTimelinePhase;
  canonDifferences: string[];
  active: boolean;
  createdAt: string;
}

const KEY = "aether.world.growth.timelines.v1";

export function loadTimelines(worldId?: string): WorldBranchTimeline[] {
  try {
    const v = localStorage.getItem(KEY);
    const all: WorldBranchTimeline[] = v ? JSON.parse(v) : [];
    return worldId ? all.filter(t => t.worldId === worldId) : all;
  } catch { return []; }
}

function saveTimelines(arr: WorldBranchTimeline[]) {
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-200))); } catch {}
}

export function createBranchFromSnapshot(opts: { worldId: string; snapshotTick: number; name: string; reason: string; parentTimelineId?: string }): WorldBranchTimeline {
  const t: WorldBranchTimeline = {
    timelineId: `timeline-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    worldId: opts.worldId, name: opts.name,
    branchPointTick: opts.snapshotTick, branchReason: opts.reason,
    parentTimelineId: opts.parentTimelineId,
    currentPhase: "BRANCHED", canonDifferences: [], active: true,
    createdAt: new Date().toISOString(),
  };
  saveTimelines([...loadTimelines(), t]);
  return t;
}

export function createBranchFromContradiction(opts: { worldId: string; contradictionId: string; tick: number; name?: string }): WorldBranchTimeline {
  return createBranchFromSnapshot({
    worldId: opts.worldId, snapshotTick: opts.tick,
    name: opts.name ?? `矛盾分支-${opts.contradictionId.slice(-6)}`,
    reason: `由矛盾 ${opts.contradictionId} 触发`,
  });
}

export function compareTimelines(a: string, b: string) {
  const all = loadTimelines();
  const x = all.find(t => t.timelineId === a); const y = all.find(t => t.timelineId === b);
  if (!x || !y) return null;
  return {
    tickDelta: y.branchPointTick - x.branchPointTick,
    phaseDelta: `${x.currentPhase} → ${y.currentPhase}`,
    canonDiff: [...x.canonDifferences, ...y.canonDifferences],
  };
}

export function mergeTimeline(targetId: string, sourceId: string): boolean {
  const all = loadTimelines();
  const t = all.find(t => t.timelineId === targetId);
  const s = all.find(t => t.timelineId === sourceId);
  if (!t || !s) return false;
  const merged: WorldBranchTimeline = { ...t, canonDifferences: [...t.canonDifferences, ...s.canonDifferences, `merged ${sourceId}`], currentPhase: "MERGED" };
  saveTimelines(all.map(x => x.timelineId === targetId ? merged : x).filter(x => x.timelineId !== sourceId));
  return true;
}

export function archiveTimeline(id: string): boolean {
  const all = loadTimelines();
  const t = all.find(x => x.timelineId === id);
  if (!t) return false;
  saveTimelines(all.map(x => x.timelineId === id ? { ...x, currentPhase: "ARCHIVED", active: false } : x));
  return true;
}

export function exportTimeline(id: string): string {
  const t = loadTimelines().find(x => x.timelineId === id);
  return JSON.stringify(t ?? {}, null, 2);
}
