// 创始人中枢 本地存储（种子、决策、设置）
import type { SeedRecord, SeedKind, SeedStage, SeedOutcome } from "./cockpitTypes";

const SEED_KEY = "aether.founder-cockpit.seeds.v1";
const MODE_KEY = "aether.founder-cockpit.mode.v1";

export type CockpitMode =
  | "OBSERVE"
  | "PLAN"
  | "SEMI_AUTO"
  | "UNATTENDED"
  | "COMPETITION";

export const COCKPIT_MODE_LABEL: Record<CockpitMode, string> = {
  OBSERVE: "观察模式",
  PLAN: "规划模式",
  SEMI_AUTO: "半自动模式",
  UNATTENDED: "无人值守",
  COMPETITION: "竞争模式",
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSeeds(): SeedRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(SEED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SeedRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSeeds(seeds: SeedRecord[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SEED_KEY, JSON.stringify(seeds.slice(-200)));
  } catch {
    // ignore
  }
}

export function addSeed(input: {
  kind: SeedKind;
  summary: string;
  note?: string;
}): SeedRecord {
  const seed: SeedRecord = {
    id: `seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    summary: input.summary.slice(0, 280),
    createdAt: Date.now(),
    stage: "SEED",
    outcomes: predictOutcomes(input.kind),
    note: input.note,
  };
  const list = loadSeeds();
  list.push(seed);
  saveSeeds(list);
  return seed;
}

export function advanceSeed(id: string, stage: SeedStage): SeedRecord | null {
  const list = loadSeeds();
  const seed = list.find((s) => s.id === id);
  if (!seed) return null;
  seed.stage = stage;
  saveSeeds(list);
  return seed;
}

export function predictOutcomes(kind: SeedKind): SeedOutcome[] {
  switch (kind) {
    case "TEXT":
      return ["TRAINING_SAMPLE", "DATASET", "DEV_TASK"];
    case "FILE":
    case "FOLDER":
      return ["TRAINING_SAMPLE", "DATASET", "CAPABILITY_PACK"];
    case "SCREENSHOT":
      return ["DEV_TASK", "PRODUCT_PAGE", "TRAINING_SAMPLE"];
    case "LINK":
      return ["DATASET", "DEV_TASK", "GROWTH_TASK"];
    case "LOVABLE_RETURN":
      return ["DEV_TASK", "RECOVERY_TASK"];
    case "USER_FEEDBACK":
      return ["DEV_TASK", "GROWTH_TASK", "TRAINING_SAMPLE"];
    case "ERROR_LOG":
      return ["RECOVERY_TASK", "DEV_TASK"];
    case "PRODUCT_IDEA":
      return ["PRODUCT_PAGE", "STORE_DRAFT", "CAPABILITY_PACK"];
    case "COMPETITOR":
      return ["DATASET", "PRODUCT_PAGE", "GROWTH_TASK"];
  }
}

export function loadMode(): CockpitMode {
  if (!isBrowser()) return "SEMI_AUTO";
  try {
    const v = window.localStorage.getItem(MODE_KEY) as CockpitMode | null;
    return v ?? "SEMI_AUTO";
  } catch {
    return "SEMI_AUTO";
  }
}

export function saveMode(mode: CockpitMode): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {
    // ignore
  }
}
