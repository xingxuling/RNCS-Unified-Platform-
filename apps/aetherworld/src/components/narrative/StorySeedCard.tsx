import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StorySeed } from "@/lib/narrative/storySeedEngine";

export function StorySeedCard({ seed }: { seed: StorySeed }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{seed.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">Logline：</span>{seed.logline}</div>
        <div className="flex flex-wrap gap-1 text-xs">
          <Badge variant="outline">主角：{seed.protagonist}</Badge>
          <Badge variant="outline">对手：{seed.antagonistOrObstacle}</Badge>
          <Badge variant="outline">核心冲突：{seed.centralConflict}</Badge>
          <Badge variant="outline">情绪核：{seed.emotionalCore}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">叙事承诺：{seed.narrativePromise}</div>
        <div className="text-xs">读者钩子：{seed.readerHook}</div>
        <div className="text-[11px] text-muted-foreground">{seed.safetyNotes.join(" ｜ ")}</div>
      </CardContent>
    </Card>
  );
}
