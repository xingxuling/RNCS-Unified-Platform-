import { WORLD_RESOURCES, type WorldResourceDef } from "@/constants/currency/worldResourceTypes";

const STORAGE_KEY = (mode: string) => `aether.world.resources.${mode.toLowerCase()}.v1`;

export type ResourceBalance = Record<string, number>;

function safeRead(mode: string): ResourceBalance {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(mode));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function safeWrite(mode: string, value: ResourceBalance) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY(mode), JSON.stringify(value)); } catch { /* noop */ }
}

export function listWorldResources(): WorldResourceDef[] {
  return [...WORLD_RESOURCES];
}

export function getResourceBalance(mode: string): ResourceBalance {
  const base: ResourceBalance = {};
  for (const r of WORLD_RESOURCES) base[r.id] = 0;
  return { ...base, ...safeRead(mode) };
}

export function grantResource(mode: string, id: string, amount: number): ResourceBalance {
  const current = safeRead(mode);
  current[id] = Math.max(0, Math.round(((current[id] ?? 0) + amount) * 100) / 100);
  safeWrite(mode, current);
  return getResourceBalance(mode);
}

export function consumeResource(mode: string, id: string, amount: number): ResourceBalance {
  const current = safeRead(mode);
  current[id] = Math.max(0, Math.round(((current[id] ?? 0) - amount) * 100) / 100);
  safeWrite(mode, current);
  return getResourceBalance(mode);
}

export function clearWorldResources(mode: string): void {
  safeWrite(mode, {});
}

/** 根据 MSL 数列推荐应增加的世界资源类型。 */
export function suggestResourcesForSequence(seq: string): string[] {
  const map: Record<string, string> = {
    "0": "VOID_TOKEN",
    "1": "ARCHIVE_SHARD",
    "2": "RELATION_THREAD",
    "3": "EXPRESSION_INK",
    "4": "RULE_STONE",
    "5": "WIND_CRYSTAL",
    "6": "LIFE_SEED",
    "7": "STAR_DUST",
    "8": "ARCHIVE_SHARD",
    "9": "STAR_DUST",
  };
  return Array.from(new Set(seq.split("").map((d) => map[d]).filter(Boolean)));
}
