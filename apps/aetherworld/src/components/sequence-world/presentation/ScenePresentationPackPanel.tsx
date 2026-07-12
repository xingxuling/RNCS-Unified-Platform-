import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScenePresentationPack } from "@/lib/sequence-world/presentation/scenePresentationPackEngine";

export function ScenePresentationPackPanel({ packs }: { packs: ScenePresentationPack[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">场景表现包 · Scene Packs ({packs.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {packs.length === 0 && <div className="text-xs text-muted-foreground">暂无场景表现包。</div>}
        {packs.map(p => (
          <div key={p.packId} className="border rounded-md p-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{p.targetType}</Badge>
              <span className="font-medium">{p.name}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              渲染 {p.renderRuntime.renderStyle} · 物理 {p.semanticPhysicsRuntime.globalMotionBias} · 镜头 {p.cameraLanguage.defaultCameraMode} · 声音 {p.audioAtmosphere.musicMood}
            </div>
            <div className="text-xs mt-1">标签：{p.exportTags.join("、")}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
