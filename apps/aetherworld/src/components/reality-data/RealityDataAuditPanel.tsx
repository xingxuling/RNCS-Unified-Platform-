import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { runRealityDataAudit } from "@/lib/reality-data/realityDataAuditEngine";

export function RealityDataAuditPanel() {
  const audit = runRealityDataAudit();
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">现实数据审计</div>
        <Badge variant={audit.status === "CRITICAL" ? "destructive" : audit.status === "WARN" ? "secondary" : "default"}>{audit.status}</Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        Sources={audit.totalSources} · stale={audit.staleCount} · 无日期={audit.noSourceDate} · 规则数={audit.rulesChecked}
      </div>
      <div className="space-y-1 text-xs">
        {audit.issues.length === 0 ? <div className="text-muted-foreground">无问题。</div> : audit.issues.map((i) => (
          <div key={i.id} className="border-t pt-2">
            <div className="flex gap-2">
              <Badge variant={i.severity === "CRITICAL" ? "destructive" : "outline"}>{i.severity}</Badge>
              <span className="font-medium">{i.title}</span>
            </div>
            <div className="text-muted-foreground">{i.detail}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
