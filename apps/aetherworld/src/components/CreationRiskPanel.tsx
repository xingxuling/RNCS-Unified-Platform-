import type { IdentifiedRisk } from "@/lib/creationRiskAnalyzer";

export function CreationRiskPanel({ risks }: { risks: IdentifiedRisk[] }) {
  if (risks.length === 0) {
    return <div className="aether-card p-4 text-xs text-muted-foreground">未识别明显风险。仍需以真实测试为准。</div>;
  }
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Main Risks · 关键风险</div>
      {risks.map(r => (
        <div key={r.id} className="border-l-2 pl-3 py-1"
          style={{ borderColor: r.severity === "CRITICAL" ? "rgb(248,113,113)" : r.severity === "HIGH" ? "rgb(251,191,36)" : "rgb(148,163,184)" }}>
          <div className="text-sm">[{r.severity}] {r.label}</div>
          <div className="text-[11px] text-muted-foreground">{r.description}</div>
          <div className="text-[10px] text-muted-foreground">命中：{r.hitBy.join("；")}</div>
        </div>
      ))}
    </div>
  );
}
