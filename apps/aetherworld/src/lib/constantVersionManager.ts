// 常数宇宙 v1.0 · 版本管理
import { CONSTANT_UNIVERSE_VERSION } from "./constantUniverseEngine";

export interface ConstantVersion {
  version: string;
  changedAt: string;
  changedBy: string;
  changedGroups: string[];
  notes: string;
}

const KEY = "aether_constant_universe_versions";

const DEFAULT_VERSIONS: ConstantVersion[] = [
  {
    version: CONSTANT_UNIVERSE_VERSION,
    changedAt: new Date().toISOString(),
    changedBy: "system",
    changedGroups: ["NUMBER","FIVE_DOMAIN","OPERATOR","TIME_PHASE","EVENT","FEEDBACK","USER","PLATFORM","PHYSICAL"],
    notes: "初始化常数宇宙 v1.0：统一 9 大分组的常数来源。",
  },
];

export function getVersionHistory(): ConstantVersion[] {
  if (typeof window === "undefined") return DEFAULT_VERSIONS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_VERSIONS;
    return JSON.parse(raw) as ConstantVersion[];
  } catch {
    return DEFAULT_VERSIONS;
  }
}

export function appendVersion(v: Omit<ConstantVersion, "changedAt">): ConstantVersion {
  const entry: ConstantVersion = { ...v, changedAt: new Date().toISOString() };
  const list = [entry, ...getVersionHistory()];
  if (typeof window !== "undefined") {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  }
  return entry;
}

export function currentVersion(): string {
  return getVersionHistory()[0]?.version ?? CONSTANT_UNIVERSE_VERSION;
}
