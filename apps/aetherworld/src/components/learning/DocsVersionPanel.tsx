import { listDocsVersions, getCurrentDocsVersion, getStaleReasons } from "@/lib/learning/docsVersioningEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DocsVersionPanel() {
  const versions = listDocsVersions();
  const current = getCurrentDocsVersion();
  const stale = getStaleReasons();
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">当前版本</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <div>版本：<Badge>{current.version}</Badge></div>
          <div className="text-muted-foreground">{current.summary}</div>
          <div className="text-xs text-muted-foreground">系统 {current.relatedSystemVersion} · 常数 {current.relatedConstantVersion} · 宪法 {current.relatedConstitutionVersion}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Stale 原因</CardTitle></CardHeader>
        <CardContent className="text-sm">{stale.length === 0 ? <span className="text-muted-foreground">无</span> : stale.map((r) => <Badge key={r} variant="outline" className="mr-1">{r}</Badge>)}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">历史版本</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {versions.map((v) => (
            <div key={v.versionId} className="rounded-md border border-border p-2">
              <div className="text-xs font-mono">{v.version} · {v.createdAt}</div>
              <div className="text-muted-foreground">{v.summary}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
