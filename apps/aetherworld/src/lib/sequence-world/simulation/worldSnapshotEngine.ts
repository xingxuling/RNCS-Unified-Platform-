// World Snapshot Engine
import type { SimulatedWorldState, SimulatedNpc } from "./worldSimulationCore";
import type { SimulatedZone } from "./zoneEcologyEngine";
import type { SimulatedEvent } from "./eventScheduler";

export interface WorldSnapshot {
  id: string;
  worldId: string;
  tick: number;
  createdAt: string;
  worldStateSummary: string;
  phase: string;
  activeZones: string[];
  activeNpcs: string[];
  activeEvents: string[];
  resources: Record<string, number>;
  causalChainLength: number;
  notes: string[];
}

const STORE_KEY = "aether.world.sim.snapshots.v1";

export function createSnapshot(opts: {
  worldId: string;
  worldState: SimulatedWorldState;
  zones: SimulatedZone[];
  npcs: SimulatedNpc[];
  events: SimulatedEvent[];
  resources: Record<string, number>;
  causalChainLength: number;
  notes?: string[];
}): WorldSnapshot {
  return {
    id: `snap-${opts.worldState.tick}-${Math.random().toString(36).slice(2, 8)}`,
    worldId: opts.worldId,
    tick: opts.worldState.tick,
    createdAt: new Date().toISOString(),
    worldStateSummary: opts.worldState.summary,
    phase: opts.worldState.phase,
    activeZones: opts.zones.map(z => z.zoneId),
    activeNpcs: opts.npcs.map(n => n.npcId),
    activeEvents: opts.events.map(e => e.id),
    resources: { ...opts.resources },
    causalChainLength: opts.causalChainLength,
    notes: opts.notes ?? [],
  };
}

export function saveSnapshots(arr: WorldSnapshot[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(arr.slice(-50))); } catch {}
}
export function loadSnapshots(): WorldSnapshot[] {
  try { const v = localStorage.getItem(STORE_KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}

export function compareSnapshots(a: WorldSnapshot, b: WorldSnapshot) {
  return {
    tickDelta: b.tick - a.tick,
    phaseChanged: a.phase !== b.phase,
    causalGrowth: b.causalChainLength - a.causalChainLength,
    resourceDiff: Object.fromEntries(
      Object.keys({ ...a.resources, ...b.resources }).map(k => [k, (b.resources[k] ?? 0) - (a.resources[k] ?? 0)])
    ),
  };
}
