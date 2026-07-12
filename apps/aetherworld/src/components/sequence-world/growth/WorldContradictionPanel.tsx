import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scanContradictions } from "@/lib/sequence-world/growth/worldContradictionResolver";
import { loadCanon } from "@/lib/sequence-world/growth/worldCanonEngine";

export function WorldContradictionPanel() {
  const canon = loadCanon();
  const contras = scanContradictions({ worldId: "world-growth-sandbox", canon });
  
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">矛盾检测 · {contras.length}</h2>
      {!contras.length && (
        <Card className="p-4 text-sm text-muted-foreground">
          未发现矛盾。
        </Card>
      )}
      {contras.map((c) => (
        <Card key={c.id} className="p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{c.severity}</Badge>
            <Badge variant="outline">{c.contradictionType}</Badge>
          </div>
          <p className="text-xs">{c.explanation}</p>
          <p className="text-xs text-muted-foreground">
            建议：{c.suggestedFix}（策略 {c.fixStrategy}）
          </p>
        </Card>
      ))}
    </div>
  );
}
