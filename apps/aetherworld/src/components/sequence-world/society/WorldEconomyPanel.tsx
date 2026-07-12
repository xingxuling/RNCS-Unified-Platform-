import type { WorldEconomyState } from "@/lib/sequence-world/society/worldEconomyEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WorldEconomyPanel({ economy }: { economy: WorldEconomyState }) {
  const resources = Object.entries(economy.resources);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">世界经济 · World Economy</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="text-xs text-muted-foreground">{economy.economySummary}</div>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
          {resources.map(([k, v]) => (
            <div key={k} className="rounded border p-2">
              <div className="text-muted-foreground">{k}</div>
              <div className="text-base font-medium">{Math.round(Number(v))}</div>
              <div className="text-[10px] text-muted-foreground">稀缺 {(economy.scarcity[k] * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
        <div className="text-xs">贸易路径：{economy.tradeRoutes.length}｜财富中心：{economy.wealthCenters.join("、") || "—"}</div>
        <div className="rounded border-amber-500/30 border bg-amber-500/5 p-2 text-[11px] text-amber-200/80">
          {economy.disclaimer}
        </div>
      </CardContent>
    </Card>
  );
}
