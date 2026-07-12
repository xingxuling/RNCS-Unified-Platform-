import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RenderProfile } from "@/lib/sequence-world/renderProfileEngine";

export function RenderProfileCard({ profile }: { profile: RenderProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">渲染风格 · {profile.paletteName}</CardTitle>
        <CardDescription>{profile.backgroundStyle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex gap-2">
          {profile.primaryColors.map(c => (
            <div key={c} className="flex flex-col items-center text-xs">
              <div className="w-12 h-12 rounded border" style={{ background: c }} />
              <span className="text-muted-foreground mt-1">{c}</span>
            </div>
          ))}
          {profile.accentColors.map(c => (
            <div key={c + "-acc"} className="flex flex-col items-center text-xs">
              <div className="w-8 h-8 rounded-full border" style={{ background: c }} />
              <span className="text-muted-foreground mt-1 text-[10px]">{c}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground">灯光：</span>{profile.lightingStyle}</div>
          <div><span className="text-muted-foreground">镜头：</span>{profile.cameraMood}</div>
          <div><span className="text-muted-foreground">UI 密度：</span>{profile.uiDensity}</div>
          <div><span className="text-muted-foreground">粒子密度：</span>{(profile.particleDensity * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">符号意象</div>
          <div className="flex flex-wrap gap-1">{profile.symbolMotifs.map(m => <Badge key={m} variant="secondary">{m}</Badge>)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">材质</div>
          <div className="flex flex-wrap gap-1">{profile.materialStyle.map(m => <Badge key={m} variant="outline">{m}</Badge>)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
