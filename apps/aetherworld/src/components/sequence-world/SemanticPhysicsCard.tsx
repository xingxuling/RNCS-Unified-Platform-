import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { SemanticPhysicsProfile } from "@/lib/sequence-world/semanticPhysicsEngine";

const ROWS: Array<{ key: keyof SemanticPhysicsProfile; label: string }> = [
  { key: "resistance", label: "阻尼" },
  { key: "eventMomentum", label: "事件动量" },
  { key: "recoveryForce", label: "恢复力" },
  { key: "relationAttraction", label: "关系引力" },
  { key: "entropyDrift", label: "熵漂移" },
  { key: "phaseShiftChance", label: "相变概率" },
  { key: "collapseThreshold", label: "坍缩阈值" },
];

export function SemanticPhysicsCard({ profile }: { profile: SemanticPhysicsProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">语义物理</CardTitle>
        <CardDescription>{profile.physicsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex gap-2 flex-wrap">
          <Badge>运动：{profile.motionBias}</Badge>
          <Badge variant="outline">引力：{profile.gravityType}</Badge>
        </div>
        <div className="space-y-2">
          {ROWS.map(r => {
            const v = profile[r.key] as number;
            return (
              <div key={r.key}>
                <div className="flex justify-between text-xs"><span>{r.label}</span><span>{(v * 100).toFixed(0)}%</span></div>
                <Progress value={v * 100} />
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          注：这是世界结构如何运动的语义参数，不替代真实物理仿真。
        </p>
      </CardContent>
    </Card>
  );
}
