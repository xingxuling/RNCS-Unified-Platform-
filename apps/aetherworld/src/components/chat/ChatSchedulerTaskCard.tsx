// Chat 结果卡内的「调度任务」摘要卡片
import { Link } from "@tanstack/react-router";
import {
  TASK_STATUS_LABEL,
  TASK_TYPE_LABEL,
  type AetherTask,
} from "@/lib/scheduler/aetherSchedulerTypes";
import { confirmTask, cancelTask } from "@/lib/scheduler/aetherSchedulerRuntime";

interface Props {
  tasks: AetherTask[];
}

const STATUS_COLOR: Record<string, string> = {
  WAITING_CONFIRMATION: "text-amber-600 border-amber-500/30 bg-amber-500/10",
  BLOCKED: "text-red-600 border-red-500/30 bg-red-500/10",
  QUEUED: "text-blue-600 border-blue-500/30 bg-blue-500/10",
  RUNNING: "text-blue-700 border-blue-500/40 bg-blue-500/15",
  COMPLETED: "text-emerald-600 border-emerald-500/30 bg-emerald-500/10",
  FAILED: "text-red-600 border-red-500/30 bg-red-500/10",
};

export function ChatSchedulerTaskCard({ tasks }: Props) {
  if (!tasks.length) return null;

  return (
    <details className="rounded-md border border-border/40 bg-muted/20 text-[11px] text-muted-foreground px-2 py-1.5" open>
      <summary className="cursor-pointer hover:text-foreground flex flex-wrap gap-x-2">
        <span className="font-medium text-foreground">调度任务：</span>
        <span>已创建 {tasks.length} 个</span>
        {tasks[0] && (
          <>
            <span>·</span>
            <span>{TASK_TYPE_LABEL[tasks[0].taskType]}</span>
            <span>·</span>
            <span>{tasks[0].plan?.steps.length ?? 0} 步</span>
          </>
        )}
        <span>·</span>
        <Link to="/scheduler" className="underline hover:text-foreground">查看调度中枢 →</Link>
      </summary>

      <div className="mt-2 space-y-2 border-t border-border/40 pt-2">
        {tasks.map((task) => {
          const sc = STATUS_COLOR[task.status] ?? "text-muted-foreground border-border/40 bg-muted/30";
          return (
            <div key={task.id} className="rounded border border-border/40 bg-background/60 p-2 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded border text-[10px] ${sc}`}>
                  {TASK_STATUS_LABEL[task.status]}
                </span>
                <span className="text-foreground text-[11px] font-medium">{task.title}</span>
                <span className="text-[10px]">优先级 {task.priority}</span>
                {task.safetyStatus !== "PASS" && (
                  <span className="text-[10px] text-amber-600">安全 {task.safetyStatus}</span>
                )}
              </div>

              {task.plan && (
                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-1.5">
                  <span>计划：</span>
                  {task.plan.steps.map((s, i) => (
                    <span key={s.id}>
                      {i + 1}.{s.label}
                      {i < task.plan!.steps.length - 1 ? " →" : ""}
                    </span>
                  ))}
                </div>
              )}

              {task.blockedReason && (
                <div className="text-[10px] text-red-600">阻断原因：{task.blockedReason}</div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {task.status === "WAITING_CONFIRMATION" && (
                  <button
                    onClick={() => confirmTask(task)}
                    className="text-[10px] px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    确认继续
                  </button>
                )}
                {task.status !== "CANCELLED" && task.status !== "ARCHIVED" && (
                  <button
                    onClick={() => cancelTask(task, "用户手动取消")}
                    className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted"
                  >
                    取消
                  </button>
                )}
                <Link
                  to="/scheduler/tasks"
                  className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted"
                >
                  查看详情
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
