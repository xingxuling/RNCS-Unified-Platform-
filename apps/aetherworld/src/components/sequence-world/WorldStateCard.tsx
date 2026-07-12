import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { SequenceCoreProfile } from "@/lib/sequence-world/sequenceCoreEngine";
import type { SequenceInterpretation } from "@/lib/sequence-world/sequenceInterpreter";
import type { WorldStateProfile } from "@/lib/sequence-world/worldStateEngine";

export function WorldStateCard({ core, interpretation, world }:
  { core: SequenceCoreProfile; interpretation: SequenceInterpretation; world: WorldStateProfile }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">数列解读</CardTitle>
          <CardDescription>{interpretation.oneLineSummary}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>{interpretation.dominantStory}</p>
          <p className="text-muted-foreground">{interpretation.missingStory}</p>
          <div className="text-xs text-muted-foreground">五域偏向：{interpretation.domainStory}</div>
          <div className="flex flex-wrap gap-1 pt-2">
            {core.dominantDigits.map(d => <Badge key={d} variant="secondary">主导 {d}</Badge>)}
            {core.missingDigits.slice(0, 4).map(d => <Badge key={d} variant="outline">缺 {d}</Badge>)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            世界状态 <Badge variant="outline">{world.currentPhase}</Badge>
          </CardTitle>
          <CardDescription>{world.dominantForce} · {world.worldMood}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{world.worldDescription}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span>稳定度</span><span>{(world.stability * 100).toFixed(0)}%</span></div>
            <Progress value={world.stability * 100} />
            <div className="flex justify-between text-xs"><span>事件压力</span><span>{(world.eventPressure * 100).toFixed(0)}%</span></div>
            <Progress value={world.eventPressure * 100} />
            <div className="flex justify-between text-xs"><span>熵</span><span>{(world.entropyLevel * 100).toFixed(0)}%</span></div>
            <Progress value={world.entropyLevel * 100} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
