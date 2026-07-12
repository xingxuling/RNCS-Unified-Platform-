import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { detectAll } from "@/lib/reality-data/dataFreshnessDetector";
import { listExternalDataSources } from "@/lib/reality-data/externalDataSourceRegistry";
import { DataFreshnessBadge } from "./DataFreshnessBadge";

export function EvidenceMappingPanel() {
  const fr = detectAll();
  const src = listExternalDataSources();
  return (
    <Card className="p-4">
      <div className="text-sm font-medium mb-3">证据映射 · 数据新鲜度</div>
      <div className="space-y-2 text-xs">
        {fr.map((f) => {
          const s = src.find((x) => x.sourceId === f.sourceId);
          return (
            <div key={f.sourceId} className="flex items-center justify-between">
              <span>{s?.sourceName ?? f.sourceId}</span>
              <span className="flex gap-2 items-center">
                <DataFreshnessBadge level={f.freshnessLevel} />
                <Badge variant="outline">{s?.sourceType}</Badge>
                <span className="text-muted-foreground">{f.dataDate ?? "无日期"}</span>
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
