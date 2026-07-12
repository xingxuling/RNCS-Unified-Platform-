import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  listTasks,
  subscribeTasks,
} from "@/lib/scheduler/aetherSchedulerRuntime";
import {
  TASK_STATUS_LABEL,
  TASK_TYPE_LABEL,
  TASK_SOURCE_LABEL,
  type AetherTask,
} from "@/lib/scheduler/aetherSchedulerTypes";

export const Route = createFileRoute("/scheduler")({
  head: () => ({
    meta: [
      { title: "调度中枢 · Aetherworld" },
      { name: "description", content: "Aetherworld 统一任务编排：Chat / 预测 / 日历 / 工作区 / 商店 / 社交 / 代码 任务总览。" },
    ],
  }),
  component: SchedulerPage,
});

function SchedulerPage() {
  const [tasks, setTasks] = useState<AetherTask[]>(() => listTasks());
  useEffect(() => subscribeTasks(setTasks), []);

  const byStatus = tasks.reduce<Record<string, number>>((m, t) => {
    m[t.status] = (m[t.status] ?? 0) + 1;
    return m;
  }, {});
  const bySource = tasks.reduce<Record<string, number>>((m, t) => {
    m[t.source] = (m[t.source] ?? 0) + 1;
    return m;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">System · Scheduler</div>
          <h1 className="text-2xl font-display">调度中枢</h1>
          <p className="text-sm text-muted-foreground">
            Aetherworld 的执行调度中枢：接收 Chat / 预测 / 日历 / 工作区 / 商店 / 社交 / 代码 任务，
            统一分类、规划、排队、审计。本视图为只读总览，详细操作进入「任务列表」。
          </p>
          <div className="pt-2 flex gap-3 text-xs">
            <Link to="/scheduler/tasks" className="underline text-foreground hover:text-primary">任务列表</Link>
            <Link to="/scheduler/audit" className="underline text-muted-foreground hover:text-foreground">调度审计</Link>
            <Link to="/system-bug-audit" className="underline text-muted-foreground hover:text-foreground">Bug 审计</Link>
          </div>
        </header>

        <section>
          <h2 className="text-sm font-medium mb-2">总览</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="任务总数" value={tasks.length} />
            <Stat label="等待确认" value={byStatus["WAITING_CONFIRMATION"] ?? 0} />
            <Stat label="排队中" value={byStatus["QUEUED"] ?? 0} />
            <Stat label="被阻断" value={byStatus["BLOCKED"] ?? 0} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium mb-2">按状态分布</h2>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {Object.entries(byStatus).map(([k, v]) => (
              <span key={k} className="px-2 py-1 rounded border border-border bg-card">
                {TASK_STATUS_LABEL[k as keyof typeof TASK_STATUS_LABEL] ?? k}：{v}
              </span>
            ))}
            {Object.keys(byStatus).length === 0 && (
              <span className="text-muted-foreground">暂无任务。在 Chat 中输入「创建一个番茄钟 App」即可触发。</span>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium mb-2">按来源分布</h2>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {Object.entries(bySource).map(([k, v]) => (
              <span key={k} className="px-2 py-1 rounded border border-border bg-card">
                {TASK_SOURCE_LABEL[k as keyof typeof TASK_SOURCE_LABEL] ?? k}：{v}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium mb-2">最近任务</h2>
          <div className="space-y-2">
            {tasks.slice(0, 10).map((t) => (
              <div key={t.id} className="rounded border border-border bg-card p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted">
                    {TASK_STATUS_LABEL[t.status]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{TASK_TYPE_LABEL[t.taskType]}</span>
                  <span className="text-[10px] text-muted-foreground">来源 {TASK_SOURCE_LABEL[t.source]}</span>
                  <span className="text-foreground">{t.title}</span>
                </div>
                {t.plan && (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {t.plan.steps.map((s) => s.label).join(" → ")}
                  </div>
                )}
              </div>
            ))}
            {tasks.length === 0 && <div className="text-xs text-muted-foreground">暂无任务。</div>}
          </div>
        </section>

        <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-3">
          说明：本调度系统不执行任意 shell，不自动公开发布，不自动支付，不自动部署。
          高权限操作必须进入「等待确认」并通过 QA 与 Secret Guard。
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-xl font-display mt-1">{value}</div>
    </div>
  );
}
