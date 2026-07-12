import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CharacterArc } from "@/lib/narrative/characterArcEngine";
import { Badge } from "@/components/ui/badge";

export function CharacterArcCard({ arc }: { arc: CharacterArc }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">人物弧线 · {arc.characterName}</CardTitle></CardHeader>
      <CardContent className="space-y-1 text-xs">
        <div><Badge variant="secondary">{arc.arcType}</Badge></div>
        <div>当前态：{arc.currentState}</div>
        <div>欲望：{arc.desire} ｜ 恐惧：{arc.fear}</div>
        <div>矛盾：{arc.contradiction}</div>
        <div>面具：{arc.mask} ｜ 创伤：{arc.wound}</div>
        <div>成长方向：{arc.growthDirection}</div>
        <div className="text-muted-foreground">禁止崩坏：{arc.forbiddenBreaks.join(" / ")}</div>
      </CardContent>
    </Card>
  );
}
