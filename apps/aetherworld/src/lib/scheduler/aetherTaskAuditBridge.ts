// Scheduler → System Audit 桥：记录任务关键事件供 /system-audit 与 /system-bug-audit 复用。
import type { AetherTask } from "./aetherSchedulerTypes";

export interface SchedulerAuditEvent {
  id: string;
  taskId: string;
  taskType: string;
  status: string;
  source: string;
  module?: string;
  safetyStatus: string;
  at: string;
  note?: string;
}

const STORAGE_KEY = "aether.scheduler.audit.v0_1";
const MAX = 300;

function load(): SchedulerAuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SchedulerAuditEvent[]) : [];
  } catch {
    return [];
  }
}

function save(events: SchedulerAuditEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function recordSchedulerAudit(task: AetherTask, note?: string) {
  const events = load();
  events.unshift({
    id: `SA-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    taskId: task.id,
    taskType: task.taskType,
    status: task.status,
    source: task.source,
    module: task.assignedModule,
    safetyStatus: task.safetyStatus,
    at: new Date().toISOString(),
    note,
  });
  save(events);
}

export function listSchedulerAudits(limit = 100): SchedulerAuditEvent[] {
  return load().slice(0, limit);
}
