import { runDocsAudit } from "@/lib/learning/docsAuditEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "bg-destructive text-destructive-foreground",
  HIGH: "bg-amber-500/20 text-amber-500",
  WARN: "bg-yellow-500/20 text-yellow-600",
  INFO: "bg-muted text-muted-foreground",
};

export function DocsAuditPanel() {
  const result = runDocsAudit();
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">审计概览</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <Stat label="状态" value={result.status} />
          <Stat label="教程数" value={result.summary.totalTutorials} />
          <Stat label="模块数" value={result.summary.totalModuleDocs} />
          <Stat label="覆盖模块" value={result.summary.coveredModules} />
          <Stat label="缺失教程" value={result.summary.missingTutorials} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">问题列表（{result.issues.length}）</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {result.issues.length === 0 && <div className="text-muted-foreground">无问题。</div>}
          {result.issues.map((i) => (
            <div key={i.id} className="rounded-md border border-border p-2 flex gap-2 items-start">
              <Badge className={SEV_COLOR[i.severity] ?? ""}>{i.severity}</Badge>
              <div className="flex-1">
                <div>{i.message}</div>
                {i.target && <div className="text-xs text-muted-foreground">target: {i.target}</div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {result.suggestedFixes.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">建议修复</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            {result.suggestedFixes.map((f, i) => <div key={i}>· {f}</div>)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
