import type { DigitalRoleCalculusResult } from "@/lib/digital-roles/digitalRoleCalculus";

export function DigitalRoleAssignmentPanel({ result }: { result: DigitalRoleCalculusResult }) {
  const a = result.assignment;
  return (
    <div className="aether-card p-3 space-y-2">
      <div className="text-xs text-muted-foreground">角色分配 · {a.taskType}</div>
      <div className="text-sm">主导：<span className="font-medium text-primary">{a.primaryRole}</span></div>
      <div className="text-xs">协作：{a.secondaryRoles.join(" · ") || "无"}</div>
      <div className="text-[11px] text-muted-foreground">{a.reason}</div>
    </div>
  );
}
