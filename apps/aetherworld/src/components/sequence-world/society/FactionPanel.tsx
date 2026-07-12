import type { WorldFaction } from "@/lib/sequence-world/society/factionEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FactionPanel({ factions }: { factions: WorldFaction[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">阵营 · Factions（{factions.length}）</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {factions.map(f => (
          <div key={f.factionId} className="rounded border p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{f.name}</div>
              <Badge variant="outline" className="text-[10px]">{f.factionType}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{f.ideology}</div>
            <div className="mt-2 text-xs">目标：{f.primaryGoal}</div>
            <div className="mt-2 flex gap-2 text-[11px] text-muted-foreground">
              <span>稳定 {(f.stability*100).toFixed(0)}%</span>
              <span>外交 {(f.diplomacy*100).toFixed(0)}%</span>
              <span>侵略 {(f.aggression*100).toFixed(0)}%</span>
              <span>成员 {f.members.length}</span>
            </div>
          </div>
        ))}
        {!factions.length && <div className="text-sm text-muted-foreground">尚未生成阵营。</div>}
      </CardContent>
    </Card>
  );
}
