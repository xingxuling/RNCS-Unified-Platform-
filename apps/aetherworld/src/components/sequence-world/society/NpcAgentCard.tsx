import type { NpcAgent } from "@/lib/sequence-world/society/npcAgentCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function NpcAgentCard({ agent }: { agent: NpcAgent }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{agent.name}</span>
          <Badge variant="secondary" className="font-normal">{agent.socialRole}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-xs text-muted-foreground">
        <div>区域：{agent.currentZone}</div>
        <div>长期目标：{agent.longTermGoal}</div>
        <div>短期目标：{agent.shortTermGoal}</div>
        <div className="flex gap-2 text-[11px]">
          <span>能动 {(agent.agencyLevel * 100).toFixed(0)}%</span>
          <span>自治 {(agent.autonomyLevel * 100).toFixed(0)}%</span>
          {agent.factionId && <span>阵营 {agent.factionId.split("-").pop()}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
