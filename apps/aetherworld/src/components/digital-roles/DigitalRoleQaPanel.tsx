import type { DigitalRoleQaReport } from "@/lib/digital-roles/digitalRoleQaBridge";

export function DigitalRoleQaPanel({ qa }: { qa: DigitalRoleQaReport }) {
  return (
    <div className="aether-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">数字角色 QA</div>
        <span className={`text-[10px] px-2 py-0.5 rounded ${qa.status === "PASS" ? "bg-emerald-500/10 text-emerald-600" : qa.status === "WARN" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"}`}>{qa.status}</span>
      </div>
      {qa.blockers.length > 0 && (
        <div className="text-xs text-red-600">阻断：{qa.blockers.join("；")}</div>
      )}
      <ul className="space-y-1">
        {qa.issues.map((i, idx) => (
          <li key={idx} className="text-[11px] text-muted-foreground">[{i.severity}] {i.message}</li>
        ))}
      </ul>
    </div>
  );
}
