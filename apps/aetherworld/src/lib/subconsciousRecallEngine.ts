// 本地存储与查询
import type { RecallFragment } from "./pastLifeRecallCalculus";

const KEY_REAL = "aether.recall.fragments.real.v1";
const KEY_DEMO = "aether.recall.fragments.demo.v1";

function read(mode: "DEMO" | "REAL"): RecallFragment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(mode === "DEMO" ? KEY_DEMO : KEY_REAL);
    return raw ? (JSON.parse(raw) as RecallFragment[]) : [];
  } catch {
    return [];
  }
}

function write(mode: "DEMO" | "REAL", list: RecallFragment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(mode === "DEMO" ? KEY_DEMO : KEY_REAL, JSON.stringify(list));
}

export function listFragments(mode: "DEMO" | "REAL"): RecallFragment[] {
  return read(mode).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function saveFragment(mode: "DEMO" | "REAL", f: RecallFragment) {
  const list = read(mode);
  const idx = list.findIndex(x => x.id === f.id);
  if (idx >= 0) list[idx] = f; else list.unshift(f);
  write(mode, list);
}

export function deleteFragment(mode: "DEMO" | "REAL", id: string) {
  write(mode, read(mode).filter(x => x.id !== id));
}

export function clearFragments(mode: "DEMO" | "REAL") {
  write(mode, []);
}

export function createBlankFragment(): RecallFragment {
  return {
    id: `rf-${Date.now().toString(36)}`,
    title: "",
    fragmentType: "DREAM_FRAGMENT",
    description: "",
    sourceContext: "DREAM",
    emotionalCharge: 5,
    imageIntensity: 5,
    recurrenceFrequency: 3,
    bodyResonance: 3,
    culturalDistance: 5,
    narrativeCoherence: 5,
    symbols: [],
    possibleExternalSources: [],
    createdAt: new Date().toISOString(),
  };
}
