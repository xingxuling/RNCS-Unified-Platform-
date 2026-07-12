import type { WorldInstitution } from "@/lib/sequence-world/society/institutionEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function InstitutionPanel({ institutions }: { institutions: WorldInstitution[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">制度组织 · Institutions（{institutions.length}）</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {institutions.map(i => (
          <div key={i.institutionId} className="rounded border p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{i.name}</div>
              <Badge variant="outline" className="text-[10px]">{i.institutionType}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{i.purpose}</div>
            <div className="mt-2 text-xs">规则：{i.rules.join("；")}</div>
            <div className="mt-2 flex gap-2 text-[11px] text-muted-foreground">
              <span>权威 {(i.authorityLevel*100).toFixed(0)}%</span>
              <span>合法 {(i.legitimacy*100).toFixed(0)}%</span>
              <span>腐败风险 {(i.corruptionRisk*100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
        {!institutions.length && <div className="text-sm text-muted-foreground">尚未生成制度。</div>}
      </CardContent>
    </Card>
  );
}
