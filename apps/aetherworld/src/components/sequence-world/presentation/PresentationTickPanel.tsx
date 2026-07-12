import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runPresentationTick, type PresentationTickResult } from "@/lib/sequence-world/presentation/presentationTickEngine";

export function PresentationTickPanel({ defaultPhase = "STABILIZATION" }: { defaultPhase?: string }) {
  const [tick, setTick] = useState(1);
  const [phase, setPhase] = useState(defaultPhase);
  const [result, setResult] = useState<PresentationTickResult | null>(null);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">表现层 Tick · Presentation Tick</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex gap-2 items-center">
          <Input type="number" value={tick} onChange={e => setTick(Number(e.target.value))} className="w-24" />
          <Input value={phase} onChange={e => setPhase(e.target.value)} placeholder="阶段，如 CONFLICT / STABILIZATION / TERMINAL" />
          <Button size="sm" onClick={() => setResult(runPresentationTick({ worldTick: tick, phaseAfter: phase, activeEventTypes: phase === "CONFLICT" ? ["CONFLICT"] : [], pressureDelta: 0 }))}>运行 Tick</Button>
        </div>
        {result && (
          <div className="text-xs space-y-1">
            <div>渲染变化：{result.renderChanges.join("；") || "无"}</div>
            <div>物理变化：{result.physicsChanges.join("；") || "无"}</div>
            <div>动画变化：{result.animationChanges.join("；") || "无"}</div>
            <div>镜头变化：{result.cameraChanges.join("；") || "无"}</div>
            <div>声音变化：{result.audioChanges.join("；") || "无"}</div>
            <div>UI 变化：{result.uiChanges.join("；") || "无"}</div>
            {result.warnings.length > 0 && <div className="text-amber-500">⚠ {result.warnings.join("；")}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
