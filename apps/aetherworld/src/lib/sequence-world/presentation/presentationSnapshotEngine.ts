import type { WorldPresentationResult } from "./worldPresentationRuntime";

export interface PresentationSnapshot {
  snapshotId: string;
  worldId: string;
  tick: number;
  renderSummary: string;
  physicsSummary: string;
  animationSummary: string;
  cameraSummary: string;
  audioSummary: string;
  uiSummary: string;
  createdAt: string;
}

const KEY = "aether.presentation.snapshots.v1";

function read(): PresentationSnapshot[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function write(list: PresentationSnapshot[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
}

export function createPresentationSnapshot(p: WorldPresentationResult, tick = 0): PresentationSnapshot {
  const snap: PresentationSnapshot = {
    snapshotId: `psnap-${Date.now()}`,
    worldId: p.worldId,
    tick,
    renderSummary: `${p.renderRuntime.renderStyle} · 强度 ${(p.renderRuntime.renderIntensity * 100).toFixed(0)}%`,
    physicsSummary: `${p.semanticPhysicsRuntime.globalMotionBias} · ${p.semanticPhysicsRuntime.gravityField}`,
    animationSummary: `${p.animationRuntime.movementStyle} · 强度 ${(p.animationRuntime.animationIntensity * 100).toFixed(0)}%`,
    cameraSummary: `${p.cameraLanguage.defaultCameraMode} · ${p.cameraLanguage.cameraRhythm}`,
    audioSummary: `${p.audioAtmosphere.ambientStyle} · ${p.audioAtmosphere.musicMood}`,
    uiSummary: `${p.uiMotion.uiDensity} · ${p.uiMotion.motionStyle}`,
    createdAt: new Date().toISOString(),
  };
  const list = read();
  list.push(snap);
  write(list);
  return snap;
}

export function loadPresentationSnapshots(): PresentationSnapshot[] { return read(); }

export function comparePresentationSnapshots(a: PresentationSnapshot, b: PresentationSnapshot): string[] {
  const diffs: string[] = [];
  if (a.renderSummary !== b.renderSummary) diffs.push(`渲染：${a.renderSummary} → ${b.renderSummary}`);
  if (a.physicsSummary !== b.physicsSummary) diffs.push(`物理：${a.physicsSummary} → ${b.physicsSummary}`);
  if (a.animationSummary !== b.animationSummary) diffs.push(`动画：${a.animationSummary} → ${b.animationSummary}`);
  if (a.cameraSummary !== b.cameraSummary) diffs.push(`镜头：${a.cameraSummary} → ${b.cameraSummary}`);
  if (a.audioSummary !== b.audioSummary) diffs.push(`声音：${a.audioSummary} → ${b.audioSummary}`);
  if (a.uiSummary !== b.uiSummary) diffs.push(`UI：${a.uiSummary} → ${b.uiSummary}`);
  return diffs;
}

export function exportPresentationSnapshot(s: PresentationSnapshot): string {
  return JSON.stringify(s, null, 2);
}
