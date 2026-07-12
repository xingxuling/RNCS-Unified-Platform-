import { CAPABILITY_DOCK_GROUPS } from "@/constants/command-canvas/capabilityDockGroups";

export interface DockCardStatus {
  id: string;
  label: string;
  route: string;
  group: string;
  status: "READY" | "RUNNING" | "WARN" | "BLOCKED" | "FALLBACK";
  lastRun?: string;
  qaStatus?: string;
}

export function getCapabilityDockGroups(): { id: string; label: string; cards: DockCardStatus[] }[] {
  return CAPABILITY_DOCK_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    cards: g.cards.map((c) => ({ ...c, status: "READY" as const, qaStatus: "READY" })),
  }));
}
