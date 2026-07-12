// 本地进化记忆 Local Evolution Memory
import type { EvolutionSignal } from "@/constants/evolutionSignals";

export interface LocalEvolutionMemory {
  userIdLocal: string;
  createdAt: string;
  updatedAt: string;
  signals: EvolutionSignal[];
  featureAffinity: Record<string, number>;
  eventAffinity: Record<string, number>;
  dimensionAffinity: Record<string, number>;
  languagePreference: string;
  uiDensityPreference: string;
  preferredModules: string[];
  hiddenModules: string[];
  feedbackReliability: number;
  promptEffectiveness: Record<string, number>;
  worldGenerationPreference: string;
  evolutionStage: string;
}

const KEY = "bioProductEvolutionMemory";
const MAX_SIGNALS = 5000;

export function emptyMemory(): LocalEvolutionMemory {
  return {
    userIdLocal: `local-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    signals: [],
    featureAffinity: {},
    eventAffinity: {},
    dimensionAffinity: {},
    languagePreference: "BEGINNER",
    uiDensityPreference: "STANDARD",
    preferredModules: [],
    hiddenModules: [],
    feedbackReliability: 0.5,
    promptEffectiveness: {},
    worldGenerationPreference: "LIGHT",
    evolutionStage: "SEED_APP",
  };
}

export function loadMemory(): LocalEvolutionMemory {
  if (typeof window === "undefined") return emptyMemory();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyMemory();
    const parsed = JSON.parse(raw) as LocalEvolutionMemory;
    return { ...emptyMemory(), ...parsed };
  } catch {
    return emptyMemory();
  }
}

export function saveMemory(mem: LocalEvolutionMemory) {
  if (typeof window === "undefined") return;
  mem.updatedAt = new Date().toISOString();
  if (mem.signals.length > MAX_SIGNALS) mem.signals = mem.signals.slice(-MAX_SIGNALS);
  try {
    localStorage.setItem(KEY, JSON.stringify(mem));
  } catch { /* quota */ }
}

export function clearMemory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function exportMemory(): string {
  return JSON.stringify(loadMemory(), null, 2);
}

export function importMemory(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return false;
    saveMemory({ ...emptyMemory(), ...parsed });
    return true;
  } catch {
    return false;
  }
}
