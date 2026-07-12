import { LEGACY_ROUTE_GROUPS, type LegacyRouteGroup } from "@/constants/command-canvas/legacyRouteGroups";

export function listLegacyRouteGroups(): LegacyRouteGroup[] {
  return LEGACY_ROUTE_GROUPS;
}

export function searchLegacyRoutes(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return LEGACY_ROUTE_GROUPS;
  return LEGACY_ROUTE_GROUPS.map((g) => ({
    ...g,
    entries: g.entries.filter((e) => e.title.toLowerCase().includes(q) || e.route.toLowerCase().includes(q)),
  })).filter((g) => g.entries.length > 0);
}
