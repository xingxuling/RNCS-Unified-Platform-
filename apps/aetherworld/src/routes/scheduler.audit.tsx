import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listSchedulerAudits, type SchedulerAuditEvent } from "@/lib/scheduler/aetherTaskAuditBridge";

export const Route = createFileRoute("/scheduler/audit")({
  head: () => ({
    meta: [
      { title: "调度审计 · Aetherworld" },
      { name: "description", content: "Aetherworld 调度审计：任务关键事件时间线。" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const [events, setEvents] = useState<SchedulerAuditEvent[]>(() => listSchedulerAudits(200));
  useEffect(() => {
    const t = setInterval(() => setEvents(listSchedulerAudits(200)), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Scheduler · Audit</div>
          <h1 className="text-2xl font-display">调度审计</h1>
          <p className="text-sm text-muted-foreground">
            任务关键事件时间线（仅记录状态、来源、模块、安全等级；不保存 secret / Full60 / Founder-only 原文）。
          </p>
          <div className="pt-1 text-xs">
            <Link to="/scheduler" className="underline text-muted-foreground hover:text-foreground">← 返回调度中枢</Link>
          </div>
        </header>

        <div className="space-y-1.5">
          {events.map((e) => (
            <div key={e.id} className="text-[11px] rounded border border-border/60 bg-card px-2 py-1.5 flex flex-wrap gap-x-2">
              <span className="text-muted-foreground">{new Date(e.at).toLocaleString()}</span>
              <span>·</span>
              <span className="text-foreground">{e.taskType}</span>
              <span>·</span>
              <span>{e.status}</span>
              <span>·</span>
              <span className="text-muted-foreground">来源 {e.source}</span>
              {e.module && (<><span>·</span><span className="text-muted-foreground">模块 {e.module}</span></>)}
              {e.safetyStatus !== "PASS" && (<><span>·</span><span className="text-amber-600">安全 {e.safetyStatus}</span></>)}
              {e.note && (<><span>·</span><span className="text-muted-foreground">{e.note}</span></>)}
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-xs text-muted-foreground">暂无调度审计记录。</div>
          )}
        </div>
      </div>
    </div>
  );
}
