import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuestEventProfile } from "@/lib/sequence-world/questEventEngine";

export function QuestEventCard({ quest }: { quest: QuestEventProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {quest.questTitle}
          <Badge variant="outline">{quest.questTypeLabel}</Badge>
        </CardTitle>
        <CardDescription>{quest.virtualDescription}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-1.5">
        {quest.realWorldMapping && (
          <div className="text-xs"><span className="text-muted-foreground">现实锚点：</span>{quest.realWorldMapping}</div>
        )}
        <div className="text-xs"><span className="text-muted-foreground">触发：</span>{quest.triggerCondition}</div>
        <div className="text-xs"><span className="text-muted-foreground">完成：</span>{quest.completionCondition}</div>
        <div className="text-xs"><span className="text-muted-foreground">奖励：</span>{quest.rewardType}</div>
        <div className="text-xs"><span className="text-muted-foreground">忽略风险：</span>{quest.riskIfIgnored}</div>
        <div className="flex gap-1 flex-wrap pt-1">
          {quest.relatedDigits.map(d => <Badge key={d} variant="secondary">数字 {d}</Badge>)}
        </div>
      </CardContent>
    </Card>
  );
}
