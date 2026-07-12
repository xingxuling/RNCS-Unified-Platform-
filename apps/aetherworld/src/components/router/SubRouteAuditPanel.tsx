/**
 * Sub-Route Audit Panel
 */
import { useMemo } from "react";
import { runRouteAudit, type AuditSeverity } from "@/lib/router/routeAuditEngine";

const SEVERITY_COLOR: Record<AuditSeverity, string> = {
  INFO: "text-muted-foreground",
  LOW: "text-sky-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-orange-400",
  CRITICAL: "text-red-500",
};

export function SubRouteAuditPanel() {
  const report = useMemo(() => runRouteAudit(), []);
  const statusColor =
    report.status === "PASS" ? "text-emerald-400" : report.status === "WARN" ? "text-amber-400" : "text-red-500";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="状态" value={report.status} valueClass={statusColor} />
        <Stat label="路由总数" value={String(report.totalRoutes)} />
        <Stat label="一级分组" value={String(report.totalGroups)} />
        <Stat label="二级子组" value={String(report.totalSubGroups)} />
      </div>

      <div className="rounded-md border border-border">
        <div className="px-4 py-2 border-b border-border text-sm text-muted-foreground">
          审计问题（{report.issues.length}）
        </div>
        {report.issues.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">无问题，子路由健康。</div>
        ) : (
          <ul className="divide-y divide-border">
            {report.issues.map((issue) => (
              <li key={issue.id} className="px-4 py-2 flex items-start gap-3 text-sm">
                <span className={`shrink-0 font-mono text-[10px] tracking-wider ${SEVERITY_COLOR[issue.severity]}`}>
                  {issue.severity}
                </span>
                <div className="flex-1">
                  <div>{issue.message}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {issue.category}
                    {issue.routeId ? ` · ${issue.routeId}` : ""}
                    {issue.path ? ` · ${issue.path}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-display ${valueClass ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}
