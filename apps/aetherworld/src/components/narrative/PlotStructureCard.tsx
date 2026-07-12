import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlotStructureResult } from "@/lib/narrative/plotStructureEngine";

export function PlotStructureCard({ plot }: { plot: PlotStructureResult }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">剧情结构</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{plot.structureType}</Badge>
          <Badge variant="outline">阶段：{plot.currentPhase}</Badge>
        </div>
        <div><span className="text-muted-foreground">本场要做：</span>{plot.requiredSceneFunction}</div>
        <div><span className="text-muted-foreground">下一 Beat：</span>{plot.nextBeat}</div>
        <div><span className="text-muted-foreground">节奏建议：</span>{plot.pacingAdvice}</div>
        <div className="text-xs">钩子：{plot.hookSuggestion}</div>
      </CardContent>
    </Card>
  );
}
