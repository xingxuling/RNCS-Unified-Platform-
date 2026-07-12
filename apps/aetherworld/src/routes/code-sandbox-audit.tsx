import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listCodeRunRecords, type WorkspaceCodeRunRecord } from "@/lib/code-sandbox/codeSandboxWorkspaceBridge";
import { CODE_SANDBOX_SAFETY_RULES } from "@/constants/code-sandbox/codeSandboxSafetyRules";
import { CodeSandboxSafetyNote } from "@/components/code-sandbox/CodeSandboxSafetyNote";

export const Route = createFileRoute("/code-sandbox-audit")({
  head: () => ({ meta: [{ title: "Code Sandbox Audit · 代码沙箱审计" }, { name: "description", content: "审计 Aether Code Sandbox Bridge 的运行状态、QA 与安全规则。" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [list, setList] = useState<WorkspaceCodeRunRecord[]>([]);
  useEffect(() => setList(listCodeRunRecords()), []);
  const total = list.length;
  const blocked = list.filter(r => r.status === "BLOCKED").length;
  const failed = list.filter(r => r.status === "FAIL").length;
  const qaFail = list.filter(r => r.qaStatus === "FAIL" || r.qaStatus === "BLOCKED").length;
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Code Sandbox Audit</div>
        <h1 className="font-display text-2xl gold-text">代码沙箱审计</h1>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="border border-border/40 rounded p-3"><div className="text-[10px] text-muted-foreground">运行总数</div><div className="text-xl tabular-nums">{total}</div></div>
        <div className="border border-border/40 rounded p-3"><div className="text-[10px] text-muted-foreground">FAIL</div><div className="text-xl tabular-nums text-red-400">{failed}</div></div>
        <div className="border border-border/40 rounded p-3"><div className="text-[10px] text-muted-foreground">BLOCKED</div><div className="text-xl tabular-nums text-red-400">{blocked}</div></div>
        <div className="border border-border/40 rounded p-3"><div className="text-[10px] text-muted-foreground">QA Fail</div><div className="text-xl tabular-nums text-amber-300">{qaFail}</div></div>
      </div>
      <div className="border border-border/40 rounded p-3 space-y-2 text-sm">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">安全规则</div>
        <ul className="space-y-1 text-[12px]">
          {CODE_SANDBOX_SAFETY_RULES.map(r => (
            <li key={r.id} className="flex gap-2">
              <span className="font-mono text-muted-foreground w-20">{r.severity}</span>
              <span>{r.rule}</span>
            </li>
          ))}
        </ul>
      </div>
      <CodeSandboxSafetyNote />
    </div>
  );
}
