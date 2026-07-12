import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SceneOutput } from "@/lib/narrative/sceneGenerator";

export function NarrativeOutputCard({ scene }: { scene: SceneOutput }) {
  const copy = async () => { try { await navigator.clipboard.writeText(scene.text); toast.success("已复制正文"); } catch { toast.error("复制失败"); } };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">场景正文 · {scene.sceneTitle}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground">功能：{scene.sceneFunction} ｜ 情绪迁移：{scene.emotionalShift}</div>
        <Textarea readOnly value={scene.text} rows={14} className="font-mono text-xs" />
        <div className="text-xs">下一钩子：{scene.nextHook}</div>
        <div className="text-xs text-muted-foreground">关键台词：{scene.keyDialogue.join(" / ")}</div>
        <Button size="sm" onClick={copy}>复制正文</Button>
      </CardContent>
    </Card>
  );
}
