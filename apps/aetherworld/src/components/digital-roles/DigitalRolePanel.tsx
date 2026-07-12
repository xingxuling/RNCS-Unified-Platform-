import { useState } from "react";
import { runDigitalRoleCalculus, type DigitalRoleCalculusResult } from "@/lib/digital-roles/digitalRoleCalculus";
import { DigitalRoleSafetyNote } from "./DigitalRoleSafetyNote";
import { DigitalRoleRegistryTable } from "./DigitalRoleRegistryTable";
import { DigitalRoleAssignmentPanel } from "./DigitalRoleAssignmentPanel";
import { DigitalRoleWorkflowPanel } from "./DigitalRoleWorkflowPanel";
import { DigitalRoleCollaborationMap } from "./DigitalRoleCollaborationMap";
import { DigitalRoleOutputPanel } from "./DigitalRoleOutputPanel";
import { DigitalRoleConflictPanel } from "./DigitalRoleConflictPanel";
import { DigitalRoleQaPanel } from "./DigitalRoleQaPanel";
import { listDigitalRoles } from "@/lib/digital-roles/digitalRoleRegistry";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border/40 rounded p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-base font-medium tabular-nums">{value}</div>
    </div>
  );
}

export function DigitalRolePanel() {
  const [input, setInput] = useState("把这个想法做成产品 MVP");
  const [result, setResult] = useState<DigitalRoleCalculusResult | null>(null);

  const run = () => setResult(runDigitalRoleCalculus(input));
  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `digital-role-${result.runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const roles = listDigitalRoles();
  const activeRoles = roles.filter((r) => r.status === "ACTIVE").length;

  return (
    <div className="space-y-5">
      <DigitalRoleSafetyNote />

      <div className="aether-card p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <Stat label="数字角色总数" value={roles.length} />
          <Stat label="活跃角色" value={activeRoles} />
          <Stat label="QA 状态" value={result?.qa.status ?? "—"} />
          <Stat label="角色冲突" value={result?.conflicts.length ?? 0} />
          <Stat label="主导角色" value={result?.assignment.primaryRole ?? "—"} />
        </div>
      </div>

      <div className="aether-card p-4 space-y-3">
        <div className="text-xs text-muted-foreground">任务输入</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="w-full bg-background/40 border border-border/40 rounded p-2 text-sm"
          placeholder="例如：把这个想法做成产品 MVP；让数字架构师设计这个系统..."
        />
        <div className="flex gap-2">
          <button onClick={run} className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:opacity-90">运行数字团队</button>
          {result && (
            <button onClick={exportJson} className="px-3 py-1.5 text-xs rounded border border-border/40 hover:bg-muted/30">导出 JSON</button>
          )}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <DigitalRoleAssignmentPanel result={result} />
          <DigitalRoleCollaborationMap result={result} />
          <DigitalRoleWorkflowPanel workflow={result.workflow} />
          <DigitalRoleOutputPanel outputs={result.outputs} />
          <DigitalRoleConflictPanel conflicts={result.conflicts} />
          <DigitalRoleQaPanel qa={result.qa} />
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">数字角色注册表</div>
        <DigitalRoleRegistryTable />
      </div>
    </div>
  );
}
