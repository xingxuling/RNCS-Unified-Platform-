import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAppWorkspaceRecords, type WorkspaceAppProjectRecord } from "@/lib/app-runtime/appWorkspaceBridge";
import { APP_SAFETY_RULES } from "@/constants/app-runtime/appSafetyRules";
import { AppRuntimeSafetyNote } from "@/components/app-runtime/AppRuntimeSafetyNote";

export const Route = createFileRoute("/app-runtime-audit")({
  head: () => ({ meta: [{ title: "App Runtime Audit · 应用运行时审计" }, { name: "description", content: "审计 App Runtime 项目的 QA、安全与导出状态。" }] }),
  component: AppRuntimeAuditPage,
});

function AppRuntimeAuditPage() {
  const [list, setList] = useState<WorkspaceAppProjectRecord[]>([]);
  useEffect(() => setList(listAppWorkspaceRecords()), []);
  const total = list.length;
  const qaFail = list.filter(r => r.qaStatus === "FAIL" || r.qaStatus === "BLOCKED").length;
  const qaWarn = list.filter(r => r.qaStatus === "WARN").length;
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">App Runtime Audit</div>
        <h1 className="font-display text-2xl gold-text">应用运行时审计</h1>
      </header>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="border border-border/40 rounded p-3"><div className="text-[10px] text-muted-foreground">项目数</div><div className="text-xl tabular-nums">{total}</div></div>
        <div className="border border-border/40 rounded p-3"><div className="text-[10px] text-muted-foreground">QA Fail</div><div className="text-xl tabular-nums text-red-400">{qaFail}</div></div>
        <div className="border border-border/40 rounded p-3"><div className="text-[10px] text-muted-foreground">QA Warn</div><div className="text-xl tabular-nums text-amber-300">{qaWarn}</div></div>
      </div>
      <div className="border border-border/40 rounded p-3 space-y-2 text-sm">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">安全规则</div>
        <ul className="space-y-1 text-[12px]">
          {APP_SAFETY_RULES.map(r => (
            <li key={r.id} className="flex gap-2">
              <span className="font-mono text-muted-foreground w-20">{r.severity}</span>
              <span>{r.rule}</span>
            </li>
          ))}
        </ul>
      </div>
      <AppRuntimeSafetyNote />
    </div>
  );
}
