import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIME_PHASE_CONSTANTS } from "@/constants/timePhaseConstants";

export function TimePhaseConstantTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>十二长生时间相位</CardTitle>
        <p className="text-xs text-muted-foreground">事件从「刚开始」到「归档」的相位。</p>
      </CardHeader>
      <CardContent>
        <ol className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {TIME_PHASE_CONSTANTS.map((p) => (
            <li key={p.phaseId} className="rounded border p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.index}. {p.name}</span>
                <Badge variant="outline" className="text-[10px]">{p.eventStageMapping}</Badge>
              </div>
              <div className="text-muted-foreground">{p.userFriendlyName}</div>
              <div className="mt-1">建议：{p.actionSuggestion}</div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
