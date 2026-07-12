import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SemanticPhysicsRuntime } from "@/lib/sequence-world/presentation/semanticPhysicsRuntime";

export function SemanticPhysicsRuntimePanel({ physics }: { physics: SemanticPhysicsRuntime }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">语义物理运行时 · Semantic Physics Runtime</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex gap-2 flex-wrap">
          <Badge>{physics.globalMotionBias}</Badge>
          <Badge variant="secondary">{physics.gravityField}</Badge>
          <span className="text-xs text-muted-foreground">阻尼 {(physics.resistanceField * 100).toFixed(0)}%</span>
        </div>
        <div className="text-xs">流场：{physics.flowField.direction} · 湍流 {(physics.flowField.turbulence * 100).toFixed(0)}% · 速度 {(physics.flowField.speed * 100).toFixed(0)}%</div>
        <div className="text-xs">吸引场：{physics.attractionFields.map(a => `${a.sourceType}(${(a.strength * 100).toFixed(0)}%)`).join("，")}</div>
        <div className="text-xs">坍缩规则：{physics.collapseRules.map(r => `${r.trigger}>${r.threshold}→${r.result}`).join("；")}</div>
        <div className="text-xs">恢复规则：{physics.recoveryRules.map(r => `${r.trigger}→${r.result}`).join("；")}</div>
        <ul className="text-xs text-muted-foreground list-disc list-inside mt-2">
          {physics.physicsSafetyNotes.map(n => <li key={n}>{n}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}
