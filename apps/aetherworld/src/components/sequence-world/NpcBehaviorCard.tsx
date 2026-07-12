import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { NpcBehaviorProfile } from "@/lib/sequence-world/npcBehaviorEngine";

export function NpcBehaviorCard({ npc }: { npc: NpcBehaviorProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {npc.npcName}
          <Badge variant="outline">{npc.archetypeLabel}</Badge>
        </CardTitle>
        <CardDescription>{npc.behaviorStyle} · 对话风格：{npc.dialogueStyle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-xs text-muted-foreground">核心需求：{npc.dominantNeed}</div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs"><span>信任度</span><span>{(npc.trustLevel * 100).toFixed(0)}%</span></div>
          <Progress value={npc.trustLevel * 100} />
          <div className="flex justify-between text-xs"><span>冲突倾向</span><span>{(npc.conflictLevel * 100).toFixed(0)}%</span></div>
          <Progress value={npc.conflictLevel * 100} />
          <div className="flex justify-between text-xs"><span>任务亲和度</span><span>{(npc.questAffinity * 100).toFixed(0)}%</span></div>
          <Progress value={npc.questAffinity * 100} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">可能行为</div>
          <ul className="text-xs list-disc list-inside space-y-0.5">{npc.likelyActions.map(a => <li key={a}>{a}</li>)}</ul>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">禁止行为</div>
          <ul className="text-xs list-disc list-inside space-y-0.5 text-muted-foreground">{npc.forbiddenActions.map(a => <li key={a}>{a}</li>)}</ul>
        </div>
      </CardContent>
    </Card>
  );
}
