import { LEGACY_ROUTE_GROUPS } from "@/constants/command-canvas/legacyRouteGroups";

export type PaletteResultType = "ROUTE" | "OBJECT" | "RUN" | "CAPABILITY" | "TERMINAL" | "DOC" | "QA_ISSUE";

export interface PaletteEntry {
  id: string;
  type: PaletteResultType;
  label: string;
  route?: string;
  group?: string;
  description?: string;
}

const ENTRIES: PaletteEntry[] = [];

// Register all legacy pages so they remain discoverable.
for (const g of LEGACY_ROUTE_GROUPS) {
  for (const e of g.entries) {
    ENTRIES.push({
      id: `route:${e.route}`,
      type: "ROUTE",
      label: e.title,
      route: e.route,
      group: g.label,
      description: e.route,
    });
  }
}

// Register Command Canvas core routes.
const CORE = [
  { route: "/command-canvas", title: "Command Canvas 主页" },
  { route: "/command-center", title: "Command Center" },
  { route: "/canvas-workspace", title: "Canvas Workspace" },
  { route: "/object-inspector", title: "Object Inspector" },
  { route: "/run-console", title: "Run Console" },
  { route: "/capability-dock", title: "Capability Dock" },
];
for (const c of CORE) {
  ENTRIES.push({ id: `route:${c.route}`, type: "ROUTE", label: c.title, route: c.route, group: "Command Canvas", description: c.route });
}

// Terminal commands.
const TERM = [
  "app.run", "app.list", "code.run", "code.repair", "webllm.run", "weblcm.run",
  "webk.run", "webk.search", "webk.route", "weblwm.tick", "webcap.run",
  "qa.check", "version.leap",
];
for (const t of TERM) {
  ENTRIES.push({ id: `term:${t}`, type: "TERMINAL", label: t, group: "Terminal", description: `终端命令 ${t}` });
}

export function searchCommandPalette(query: string): PaletteEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ENTRIES.slice(0, 40);
  return ENTRIES.filter(
    (e) => e.label.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q) ?? false) ||
      (e.group?.toLowerCase().includes(q) ?? false),
  ).slice(0, 80);
}

export function listPaletteEntries(): PaletteEntry[] { return ENTRIES.slice(); }
