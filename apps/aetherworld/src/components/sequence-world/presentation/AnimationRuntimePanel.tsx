import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnimationRuntime } from "@/lib/sequence-world/presentation/animationRuntimeEngine";

export function AnimationRuntimePanel({ animation }: { animation: AnimationRuntime }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">动画运行时 · Animation Runtime</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex gap-2 flex-wrap">
          <Badge>{animation.movementStyle}</Badge>
          <span className="text-xs text-muted-foreground">强度 {(animation.animationIntensity * 100).toFixed(0)}%</span>
          <span className="text-xs text-amber-500">过载风险 {(animation.overAnimationRisk * 100).toFixed(0)}%</span>
        </div>
        <div className="text-xs">Idle 状态：{animation.idleAnimations.map(a => `${a.name}(${a.speed.toFixed(2)})`).join("，")}</div>
        <div className="text-xs">事件触发：{animation.eventAnimationTriggers.map(t => `${t.eventType}→${t.animationStyle}`).join("；")}</div>
        <div className="text-xs">UI 触发：{animation.uiAnimationTriggers.map(t => `${t.uiEvent}→${t.animation}`).join("；")}</div>
      </CardContent>
    </Card>
  );
}
