import { SYMBOLIC_MEMORY_DOMAINS, type SymbolicMemoryDomain } from "@/constants/symbolicMemoryDomains";

export function getDomains(ids: string[]): SymbolicMemoryDomain[] {
  return ids
    .map(id => SYMBOLIC_MEMORY_DOMAINS.find(d => d.id === id))
    .filter((x): x is SymbolicMemoryDomain => !!x);
}

export function aggregateDomainAffinity(allIds: string[][]): { id: string; count: number; name: string }[] {
  const map: Record<string, number> = {};
  allIds.flat().forEach(id => { map[id] = (map[id] ?? 0) + 1; });
  return Object.entries(map)
    .map(([id, count]) => {
      const d = SYMBOLIC_MEMORY_DOMAINS.find(x => x.id === id);
      return { id, count, name: d?.userFriendlyName ?? id };
    })
    .sort((a, b) => b.count - a.count);
}
