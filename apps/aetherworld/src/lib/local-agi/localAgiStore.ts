// Aetherworld Local AGI · 持久化存储
import type {
  DevelopmentTask,
  ExternalSignal,
  FeedbackItem,
  LocalAGIAgentState,
  LocalAGIDailyReport,
  LocalAGIDecision,
  LocalAGIHeartbeat,
  LocalAGIRun,
} from "./localAgiTypes";

const K_STATE = "local-agi.state.v1";
const K_HB = "local-agi.heartbeat.v1";
const K_RUNS = "local-agi.runs.v1";
const K_DEC = "local-agi.decisions.v1";
const K_SIG = "local-agi.signals.v1";
const K_FB = "local-agi.feedback.v1";
const K_DEV = "local-agi.dev-tasks.v1";
const K_REP = "local-agi.reports.v1";

const listeners = new Set<() => void>();
export function subscribeLocalAGI(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  for (const l of listeners) l();
}

function rArr<T>(k: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(k) ?? "[]") as T[];
  } catch {
    return [];
  }
}
function wArr<T>(k: string, v: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
  emit();
}
function rObj<T>(k: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function wObj<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
  emit();
}

const DEFAULT_STATE: LocalAGIAgentState = {
  enabled: false,
  mode: "PLAN",
  currentGoal: "推进 Aetherworld 全工厂自动化",
  todayGrowthScore: 0,
};
export function getAgiState(): LocalAGIAgentState {
  return rObj<LocalAGIAgentState>(K_STATE) ?? DEFAULT_STATE;
}
export function setAgiState(p: Partial<LocalAGIAgentState>): LocalAGIAgentState {
  const next = { ...getAgiState(), ...p };
  wObj(K_STATE, next);
  return next;
}

const DEFAULT_HB: LocalAGIHeartbeat = {
  enabled: false,
  mode: "PLAN",
  intervalMinutes: 60,
  runCount: 0,
  currentFocus: "扫描全系统并生成下一步计划",
};
export function getHeartbeat(): LocalAGIHeartbeat {
  return rObj<LocalAGIHeartbeat>(K_HB) ?? DEFAULT_HB;
}
export function setHeartbeat(p: Partial<LocalAGIHeartbeat>): LocalAGIHeartbeat {
  const next = { ...getHeartbeat(), ...p };
  wObj(K_HB, next);
  return next;
}

export function listRuns(): LocalAGIRun[] {
  return rArr<LocalAGIRun>(K_RUNS).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
export function saveRun(r: LocalAGIRun) {
  const arr = rArr<LocalAGIRun>(K_RUNS);
  arr.unshift(r);
  wArr(K_RUNS, arr.slice(0, 200));
  return r;
}

export function listDecisions(): LocalAGIDecision[] {
  return rArr<LocalAGIDecision>(K_DEC).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function saveDecision(d: LocalAGIDecision) {
  const arr = rArr<LocalAGIDecision>(K_DEC);
  arr.unshift(d);
  wArr(K_DEC, arr.slice(0, 500));
  return d;
}

export function listSignals(): ExternalSignal[] {
  return rArr<ExternalSignal>(K_SIG).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function saveSignals(items: ExternalSignal[]) {
  const arr = rArr<ExternalSignal>(K_SIG);
  for (const s of items) arr.unshift(s);
  wArr(K_SIG, arr.slice(0, 300));
}

export function listFeedback(): FeedbackItem[] {
  return rArr<FeedbackItem>(K_FB).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function saveFeedback(f: FeedbackItem) {
  const arr = rArr<FeedbackItem>(K_FB);
  const idx = arr.findIndex((x) => x.id === f.id);
  if (idx >= 0) arr[idx] = f;
  else arr.unshift(f);
  wArr(K_FB, arr.slice(0, 500));
  return f;
}

export function listDevTasks(): DevelopmentTask[] {
  return rArr<DevelopmentTask>(K_DEV).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function saveDevTasks(items: DevelopmentTask[]) {
  const arr = rArr<DevelopmentTask>(K_DEV);
  for (const d of items) arr.unshift(d);
  wArr(K_DEV, arr.slice(0, 300));
}

export function listReports(): LocalAGIDailyReport[] {
  return rArr<LocalAGIDailyReport>(K_REP).sort((a, b) => b.date.localeCompare(a.date));
}
export function saveReport(r: LocalAGIDailyReport) {
  const arr = rArr<LocalAGIDailyReport>(K_REP).filter((x) => x.date !== r.date);
  arr.unshift(r);
  wArr(K_REP, arr.slice(0, 60));
  return r;
}
