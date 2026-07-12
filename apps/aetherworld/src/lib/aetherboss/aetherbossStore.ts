// AetherBoss · 持久化存储
import type {
  AetherBossAgentState,
  AetherBossDailyGrowthReport,
  AetherBossDecision,
  AetherBossRecoveryPlan,
  AetherBossRun,
  HeartbeatSchedule,
} from "./aetherbossTypes";

const KEY_STATE = "aetherboss.agent-state.v1";
const KEY_RUNS = "aetherboss.runs.v1";
const KEY_DECISIONS = "aetherboss.decisions.v1";
const KEY_RECOVERY = "aetherboss.recovery.v1";
const KEY_REPORTS = "aetherboss.reports.v1";
const KEY_SCHEDULE = "aetherboss.schedule.v1";

const listeners = new Set<() => void>();
export function subscribeAetherBoss(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  for (const l of listeners) l();
}

function readArr<T>(k: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function writeArr<T>(k: string, v: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
  emit();
}
function readObj<T>(k: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeObj<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
  emit();
}

// ---- Agent state ----
const DEFAULT_STATE: AetherBossAgentState = {
  enabled: false,
  mode: "PLAN_ONLY",
  currentGoal: "推进 AetherSeed 300M 数据生产与训练就绪",
};
export function getAgentState(): AetherBossAgentState {
  return readObj<AetherBossAgentState>(KEY_STATE) ?? DEFAULT_STATE;
}
export function setAgentState(patch: Partial<AetherBossAgentState>): AetherBossAgentState {
  const next = { ...getAgentState(), ...patch };
  writeObj(KEY_STATE, next);
  return next;
}

// ---- Schedule ----
const DEFAULT_SCHEDULE: HeartbeatSchedule = {
  id: "boss_default",
  agentId: "aetherboss",
  enabled: false,
  intervalMinutes: 45,
  mode: "PLAN_ONLY",
};
export function getSchedule(): HeartbeatSchedule {
  return readObj<HeartbeatSchedule>(KEY_SCHEDULE) ?? DEFAULT_SCHEDULE;
}
export function setSchedule(patch: Partial<HeartbeatSchedule>): HeartbeatSchedule {
  const next = { ...getSchedule(), ...patch };
  writeObj(KEY_SCHEDULE, next);
  return next;
}

// ---- Runs ----
export function listRuns(): AetherBossRun[] {
  return readArr<AetherBossRun>(KEY_RUNS).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
export function saveRun(r: AetherBossRun): AetherBossRun {
  const arr = readArr<AetherBossRun>(KEY_RUNS);
  const idx = arr.findIndex((x) => x.id === r.id);
  if (idx >= 0) arr[idx] = r;
  else arr.unshift(r);
  writeArr(KEY_RUNS, arr.slice(0, 200));
  return r;
}

// ---- Decisions ----
export function listDecisions(): AetherBossDecision[] {
  return readArr<AetherBossDecision>(KEY_DECISIONS).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
export function saveDecision(d: AetherBossDecision): AetherBossDecision {
  const arr = readArr<AetherBossDecision>(KEY_DECISIONS);
  arr.unshift(d);
  writeArr(KEY_DECISIONS, arr.slice(0, 500));
  return d;
}

// ---- Recovery ----
export function listRecoveryPlans(): AetherBossRecoveryPlan[] {
  return readArr<AetherBossRecoveryPlan>(KEY_RECOVERY).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
export function saveRecoveryPlan(p: AetherBossRecoveryPlan): AetherBossRecoveryPlan {
  const arr = readArr<AetherBossRecoveryPlan>(KEY_RECOVERY);
  arr.unshift(p);
  writeArr(KEY_RECOVERY, arr.slice(0, 200));
  return p;
}

// ---- Daily reports ----
export function listReports(): AetherBossDailyGrowthReport[] {
  return readArr<AetherBossDailyGrowthReport>(KEY_REPORTS).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}
export function saveReport(r: AetherBossDailyGrowthReport): AetherBossDailyGrowthReport {
  const arr = readArr<AetherBossDailyGrowthReport>(KEY_REPORTS).filter((x) => x.date !== r.date);
  arr.unshift(r);
  writeArr(KEY_REPORTS, arr.slice(0, 60));
  return r;
}
