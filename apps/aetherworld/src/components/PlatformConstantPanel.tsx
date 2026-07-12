import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_CONSTANTS, XIAOHONGSHU_CONSTANTS } from "@/constants/platformConstants";

export function PlatformConstantPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>平台常数</CardTitle>
        <p className="text-xs text-muted-foreground">传播平台的权重参数；小红书完整暴露所有传播因子。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {PLATFORM_CONSTANTS.map((p) => (
            <div key={p.id} className="rounded border p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                <Badge variant="outline">{p.defaultBias}</Badge>
              </div>
              <div className="text-muted-foreground">{p.language}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border p-3 bg-muted/30">
          <div className="text-sm font-medium mb-2">小红书 · 完整参数</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {Object.entries(XIAOHONGSHU_CONSTANTS).map(([k,v]) => (
              <div key={k} className="rounded border p-2 bg-background">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-mono">{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
