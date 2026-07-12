import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CameraLanguageProfile } from "@/lib/sequence-world/presentation/cameraLanguageEngine";

export function CameraLanguagePanel({ camera }: { camera: CameraLanguageProfile }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">镜头语言 · Camera Language</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex gap-2 flex-wrap">
          <Badge>{camera.defaultCameraMode}</Badge>
          <Badge variant="secondary">{camera.cameraRhythm}</Badge>
          <span className="text-xs text-muted-foreground">转场 {camera.transitionStyle}</span>
        </div>
        <div className="text-xs">镜头组：{camera.shotTypes.map(s => `${s.shotType}/${s.emotionalMeaning}`).join("，")}</div>
        <div className="text-xs">事件镜头：{camera.eventCameraRules.map(r => `${r.eventType}→${r.shotType}`).join("；")}</div>
        <div className="text-xs text-muted-foreground">影像风险 {(camera.cinematicRisk * 100).toFixed(0)}%</div>
      </CardContent>
    </Card>
  );
}
