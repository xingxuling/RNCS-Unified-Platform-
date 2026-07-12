import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  listTasks,
  subscribeTasks,
  confirmTask,
  cancelTask,
} from "@/lib/scheduler/aetherSchedulerRuntime";
import {
  TASK_STATUS_LABEL,
  TASK_TYPE_LABEL,
  TASK_SOURCE_LABEL,
  type AetherTask,
  type AetherTaskStatus,
} from "@/lib/scheduler/aetherSchedulerTypes";

export const Route = createFileRoute("/scheduler/tasks")({
  head: () => ({
    meta: [
      { title: "调度任务列表 · Aetherworld" },
      { name: "description", content: "Aetherworld 调度任务列表：按状态筛选、确认、取消。" },
    ],
  }),
  component: TasksPage,
});

const STATUS_FILTERS: (AetherTaskStatus | "ALL")[] = [
  "ALL", "WAITING_CONFIRMATION", "QUEUED", "RUNNING", "COMPLETED", "FAILED", "BLOCKED",
];

function TasksPage() {
  const [tasks, setTasks] = useState<AetherTask[]>(() => listTasks());
  const [filter, setFilter] = useState<AetherTaskStatus | "ALL">("ALL");
  useEffect(() => subscribeTasks(setTasks), []);
  const filtered = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Scheduler · Tasks</div>
          <h1 className="text-2xl font-display">任务列表</h1>
          <p className="text-sm text-muted-foreground">查看与管理调度任务。高风险操作需用户确认。</p>
        </header>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2 py-1 rounded border ${
                filter === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
              }`}
            >
              {s === "ALL" ? "全部" : TASK_STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-3 text-xs space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted">
                  {TASK_STATUS_LABEL[t.status]}
                </span>
                <span className="text-[10px] text-muted-foreground">{TASK_TYPE_LABEL[t.taskType]}</span>
                <span className="text-[10px] text-muted-foreground">来源 {TASK_SOURCE_LABEL[t.source]}</span>
                <span className="text-[10px] text-muted-foreground">优先级 {t.priority}</span>
                <span className="text-foreground font-medium">{t.title}</span>
              </div>
              {t.description && <div className="text-[11px] text-muted-foreground">{t.description}</div>}
              {t.plan && (
                <div className="text-[10px] text-muted-foreground">
                  计划（{t.plan.steps.length} 步 · 风险 {t.plan.riskLevel}）：
                  {t.plan.steps.map((s) => s.label).join(" → ")}
                </div>
              )}
              {t.blockedReason && (
                <div className="text-[11px] text-red-600">阻断：{t.blockedReason}</div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {t.status === "WAITING_CONFIRMATION" && (
                  <button
                    onClick={() => confirmTask(t)}
                    className="text-[11px] px-2 py-1 rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    确认继续
                  </button>
                )}
                {t.status !== "CANCELLED" && t.status !== "ARCHIVED" && t.status !== "COMPLETED" && (
                  <button
                    onClick={() => cancelTask(t, "在任务列表中取消")}
                    className="text-[11px] px-2 py-1 rounded border border-border hover:bg-muted"
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-xs text-muted-foreground">没有匹配的任务。</div>}
        </div>
      </div>
    </div>
  );
}
