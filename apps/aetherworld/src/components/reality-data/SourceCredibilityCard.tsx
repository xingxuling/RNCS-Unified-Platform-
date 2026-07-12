import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scoreAll } from "@/lib/reality-data/sourceCredibilityScorer";
import { listExternalDataSources } from "@/lib/reality-data/externalDataSourceRegistry";

export function SourceCredibilityCard() {
  const scores = scoreAll();
  const sources = listExternalDataSources();
  return (
    <Card className="p-4">
      <div className="text-sm font-medium mb-3">来源可信度评分</div>
      <div className="space-y-2">
        {scores.map((s) => {
          const src = sources.find((x) => x.sourceId === s.sourceId);
          return (
            <div key={s.sourceId} className="flex items-center justify-between text-xs">
              <span className="font-medium">{src?.sourceName ?? s.sourceId}</span>
              <span className="flex gap-2 items-center">
                <Badge variant="outline">{s.level}</Badge>
                <span className="text-muted-foreground">{s.score.toFixed(2)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
