import type { WorldCanonEntryType, WorldCanonLevel } from "@/constants/sequence-world/growth/worldCanonTypes";

export interface WorldCanonEntry {
  id: string;
  worldId: string;
  title: string;
  entryType: WorldCanonEntryType;
  summary: string;
  body: string;
  canonLevel: WorldCanonLevel;
  sourceEvent?: string;
  sourceTick?: number;
  relatedIds: string[];
  createdAt: string;
  updatedAt: string;
  knowledgeMarker: "FICTIONAL_LORE" | "WORLD_ENGINE_OUTPUT" | "ENGINE_DOC";
  accessLevel: "PUBLIC" | "USER_PRIVATE" | "FOUNDER_PRIVATE";
}

const KEY = "aether.world.growth.canon.v1";

export function loadCanon(worldId?: string): WorldCanonEntry[] {
  try {
    const v = localStorage.getItem(KEY);
    const all: WorldCanonEntry[] = v ? JSON.parse(v) : [];
    return worldId ? all.filter(c => c.worldId === worldId) : all;
  } catch { return []; }
}

function saveCanon(arr: WorldCanonEntry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-1000))); } catch {}
}

export function upsertCanonEntry(entry: Omit<WorldCanonEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }): WorldCanonEntry {
  const all = loadCanon();
  const now = new Date().toISOString();
  if (entry.id) {
    const existing = all.find(c => c.id === entry.id);
    if (existing) {
      if (existing.canonLevel === "FOUNDER_LOCKED" && entry.canonLevel !== "FOUNDER_LOCKED") {
        // do not allow downgrade silently
        return existing;
      }
      const next: WorldCanonEntry = { ...existing, ...entry, id: existing.id, updatedAt: now } as WorldCanonEntry;
      saveCanon(all.map(c => c.id === next.id ? next : c));
      return next;
    }
  }
  const created: WorldCanonEntry = {
    id: entry.id ?? `canon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    createdAt: now, updatedAt: now,
    ...entry,
  } as WorldCanonEntry;
  saveCanon([...all, created]);
  return created;
}

export function setCanonLevel(id: string, level: WorldCanonLevel, isFounder?: boolean): WorldCanonEntry | null {
  const all = loadCanon();
  const target = all.find(c => c.id === id);
  if (!target) return null;
  if (target.canonLevel === "FOUNDER_LOCKED" && !isFounder) return target;
  if (level === "FOUNDER_LOCKED" && !isFounder) return target;
  const next = { ...target, canonLevel: level, updatedAt: new Date().toISOString() };
  saveCanon(all.map(c => c.id === id ? next : c));
  return next;
}

const KIND_TO_ENTRY_TYPE: Record<string, WorldCanonEntryType> = {
  ZONE: "ZONE", NPC: "NPC", QUEST: "EVENT", EVENT: "EVENT",
  RULE: "WORLD_RULE", SYSTEM: "WORLD_RULE",
  RESOURCE: "RESOURCE", TIMELINE: "TIMELINE",
  LORE: "LORE", RELATION: "LORE",
};

export function autoDraftCanonFromExpansion(worldId: string, items: Array<{ kind: string; name?: string; title?: string; flavor?: string }>, tick?: number): WorldCanonEntry[] {
  return items.map(it => {
    const title = it.title ?? it.name ?? `${it.kind} 条目`;
    const level: WorldCanonLevel = it.kind === "RULE" || it.kind === "SYSTEM" ? "HARD_CANON" : it.kind === "NPC" ? "SOFT_CANON" : "DRAFT";
    return upsertCanonEntry({
      worldId,
      title,
      entryType: KIND_TO_ENTRY_TYPE[it.kind] ?? "LORE",
      summary: it.flavor ?? `${it.kind} ${title}`,
      body: `自动草拟：${title}（${it.kind}）`,
      canonLevel: level,
      sourceTick: tick,
      relatedIds: [],
      knowledgeMarker: "WORLD_ENGINE_OUTPUT",
      accessLevel: "USER_PRIVATE",
    });
  });
}
