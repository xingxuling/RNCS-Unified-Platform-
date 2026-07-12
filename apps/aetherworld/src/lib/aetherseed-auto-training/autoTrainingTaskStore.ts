// AetherSeed Auto Training Executor · 任务存储（内存）
import type {
  AutoTrainingCommand,
  AutoTrainingDryRunResult,
  AutoTrainingRun,
  AutoTrainingTask,
  AutoTrainingTaskStatus,
} from "./autoTrainingTypes";

const TASKS = new Map<string, AutoTrainingTask>();
const DRY_RUNS = new Map<string, AutoTrainingDryRunResult>(); // key = taskId
const COMMANDS = new Map<string, AutoTrainingCommand[]>();    // key = taskId
const RUNS = new Map<string, AutoTrainingRun>();              // key = runId

export function saveTask(t: AutoTrainingTask): AutoTrainingTask {
  TASKS.set(t.id, t);
  return t;
}
export function listTasks(): AutoTrainingTask[] {
  return Array.from(TASKS.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function getTask(id: string): AutoTrainingTask | undefined {
  return TASKS.get(id);
}
export function updateTaskStatus(id: string, status: AutoTrainingTaskStatus, patch?: Partial<AutoTrainingTask>): AutoTrainingTask | undefined {
  const t = TASKS.get(id);
  if (!t) return undefined;
  const updated: AutoTrainingTask = { ...t, ...patch, status, updatedAt: new Date().toISOString() };
  TASKS.set(id, updated);
  return updated;
}

export function saveDryRun(r: AutoTrainingDryRunResult) {
  DRY_RUNS.set(r.taskId, r);
  return r;
}
export function getDryRun(taskId: string): AutoTrainingDryRunResult | undefined {
  return DRY_RUNS.get(taskId);
}

export function saveCommands(taskId: string, cmds: AutoTrainingCommand[]) {
  COMMANDS.set(taskId, cmds);
  return cmds;
}
export function getCommands(taskId: string): AutoTrainingCommand[] {
  return COMMANDS.get(taskId) ?? [];
}

export function saveRun(r: AutoTrainingRun) {
  RUNS.set(r.id, r);
  return r;
}
export function listRuns(): AutoTrainingRun[] {
  return Array.from(RUNS.values()).sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
}
export function getRun(id: string): AutoTrainingRun | undefined {
  return RUNS.get(id);
}

export interface AutoTrainingSnapshot {
  total: number;
  draft: number;
  dryRunReady: number;
  waitingConfirmation: number;
  readyToRun: number;
  running: number;
  completed: number;
  failed: number;
  blocked: number;
  cancelled: number;
  /** 已生成 dry-run 结果的任务数（不论环境） */
  dryRunGenerated: number;
  /** dry-run blockedReasons 为空的任务数（浏览器侧也可达） */
  dryRunPassedBrowser: number;
  /** dry-run canRun=true 的任务数（需真实网关 / IPC） */
  dryRunPassedGateway: number;
}

export function buildAutoTrainingSnapshot(): AutoTrainingSnapshot {
  const tasks = listTasks();
  const c = (s: AutoTrainingTaskStatus) => tasks.filter((t) => t.status === s).length;
  let dryRunGenerated = 0;
  let dryRunPassedBrowser = 0;
  let dryRunPassedGateway = 0;
  for (const t of tasks) {
    const d = DRY_RUNS.get(t.id);
    if (!d) continue;
    dryRunGenerated += 1;
    if (d.blockedReasons.length === 0) dryRunPassedBrowser += 1;
    if (d.canRun) dryRunPassedGateway += 1;
  }
  return {
    total: tasks.length,
    draft: c("DRAFT"),
    dryRunReady: c("DRY_RUN_READY"),
    waitingConfirmation: c("WAITING_CONFIRMATION"),
    readyToRun: c("READY_TO_RUN"),
    running: c("RUNNING"),
    completed: c("COMPLETED"),
    failed: c("FAILED"),
    blocked: c("BLOCKED"),
    cancelled: c("CANCELLED"),
    dryRunGenerated,
    dryRunPassedBrowser,
    dryRunPassedGateway,
  };
}
