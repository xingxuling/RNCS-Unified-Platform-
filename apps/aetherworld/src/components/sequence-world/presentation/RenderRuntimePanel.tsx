import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SequenceRenderRuntime } from "@/lib/sequence-world/presentation/sequenceRenderRuntime";

export function RenderRuntimePanel({ render }: { render: SequenceRenderRuntime }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">渲染运行时 · Render Runtime</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge>{render.renderStyle}</Badge>
          <span className="text-xs text-muted-foreground">强度 {(render.renderIntensity * 100).toFixed(0)}%</span>
          <span className="text-xs text-muted-foreground">噪音风险 {(render.visualNoiseRisk * 100).toFixed(0)}%</span>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">主色</div>
          <div className="flex gap-1">{render.palette.primary.map(c => <div key={c} className="w-8 h-8 rounded border" style={{ background: c }} title={c} />)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">辅色</div>
          <div className="flex gap-1 flex-wrap">{render.palette.accent.map(c => <div key={c} className="w-6 h-6 rounded border" style={{ background: c }} title={c} />)}</div>
        </div>
        <div className="text-xs">光照：{render.lighting.mode} · key {render.lighting.keyLight} · rim {render.lighting.rimLight} · bloom {(render.lighting.bloomIntensity * 100).toFixed(0)}%</div>
        <div className="text-xs">材质：{render.materials.map(m => m.materialType).join("、")}</div>
        <div className="text-xs">粒子：{render.particles.map(p => `${p.particleType}/${(p.density * 100).toFixed(0)}%`).join("，")}</div>
        <div className="text-xs">符号：{render.symbolicOverlays.map(s => s.motif).join("、")}</div>
      </CardContent>
    </Card>
  );
}
