import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MSLBlockAnalysis } from "@/lib/msl/mslBlockAnalyzer";

export function MSLBlockView({ blocks }: { blocks: MSLBlockAnalysis[] }) {
  if (blocks.length === 0) return null;
  return (
    <Card className="p-4 space-y-3 aether-card-elevated">
      <div className="text-sm font-medium">Block Analysis</div>
      <div className="space-y-3">
        {blocks.map((b, i) => (
          <div key={i} className="border border-border rounded p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{b.blockZh} · {b.blockName}</div>
              <Badge variant="outline">{b.startIndex}..{b.endIndex} · {b.phaseType}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{b.narrativeArc}</div>
            <div className="text-xs">主导数字：{b.dominantDigits.join("，") || "—"}</div>
            <div className="text-xs">{b.terminalPattern}</div>
            <div className="text-xs">引擎语义：{b.engineMeaning}</div>
            <div className="text-xs">推荐引擎：{b.recommendedEngines.join("，") || "—"}</div>
            <div className="text-[10px] text-muted-foreground">匹配语句数：{b.matchedStatementCount}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
