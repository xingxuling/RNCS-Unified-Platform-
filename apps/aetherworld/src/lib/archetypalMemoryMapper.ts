import { ARCHETYPAL_MEMORY_TYPES, type ArchetypalMemoryType } from "@/constants/archetypalMemoryTypes";

export function getArchetypes(ids: string[]): ArchetypalMemoryType[] {
  return ids
    .map(id => ARCHETYPAL_MEMORY_TYPES.find(a => a.id === id))
    .filter((x): x is ArchetypalMemoryType => !!x);
}

export function aggregateArchetypeAffinity(allIds: string[][]): Record<string, number> {
  const map: Record<string, number> = {};
  allIds.flat().forEach(id => { map[id] = (map[id] ?? 0) + 1; });
  return map;
}
