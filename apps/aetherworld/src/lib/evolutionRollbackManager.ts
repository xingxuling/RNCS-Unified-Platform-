// 进化回滚管理器 Evolution Rollback Manager
import { loadProfile, saveProfile } from "./personalAppProfileEngine";
import type { PersonalAppProfile } from "@/constants/personalAppProfileSchema";

export interface EvolutionSnapshot {
  id: string;
  createdAt: string;
  reason: string;
  appProfileBefore: PersonalAppProfile;
  memorySummaryBefore: {
    signalCount: number;
    feedbackReliability: number;
    languagePreference: string;
    topModules: string[];
  };
}

const KEY = "evolutionSnapshots";
const MAX = 20;

export function listSnapshots(): EvolutionSnapshot[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function pushSnapshot(reason: string, summary: EvolutionSnapshot["memorySummaryBefore"]) {
  if (typeof window === "undefined") return;
  const snap: EvolutionSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    reason,
    appProfileBefore: loadProfile(),
    memorySummaryBefore: summary,
  };
  const all = [snap, ...listSnapshots()].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* quota */ }
}

export function rollbackTo(id: string): boolean {
  const all = listSnapshots();
  const snap = all.find(s => s.id === id);
  if (!snap) return false;
  saveProfile(snap.appProfileBefore);
  return true;
}

export function rollbackLast(): boolean {
  const all = listSnapshots();
  if (!all.length) return false;
  return rollbackTo(all[0].id);
}

export function clearSnapshots() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
