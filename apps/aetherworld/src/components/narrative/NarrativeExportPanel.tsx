import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { NarrativeGenerationResult } from "@/lib/narrative/narrativeTextEngine";

export function NarrativeExportPanel({ result }: { result: NarrativeGenerationResult }) {
  const [fmt, setFmt] = useState<"MARKDOWN" | "JSON" | "PROMPT">("MARKDOWN");
  const md =
    `# ${result.storySeed.title}\n\n${result.storySeed.logline}\n\n## 场景\n${result.scene.text}\n\n## 对白\n${result.dialogue.dialogueLines.map(l => `- ${l.speaker}：${l.line}`).join("\n")}\n\n## 冲突\n${result.conflict.mainConflict}\n\n## 下一钩子\n${result.scene.nextHook}\n`;
  const json = JSON.stringify(result, null, 2);
  const prompt = `请基于以下故事种子继续创作：\n${result.storySeed.logline}\n核心冲突：${result.conflict.mainConflict}\n场景：${result.scene.sceneTitle}\n下一钩子：${result.scene.nextHook}\n`;
  const content = fmt === "MARKDOWN" ? md : fmt === "JSON" ? json : prompt;
  const copy = async () => { try { await navigator.clipboard.writeText(content); toast.success("已复制"); } catch { toast.error("复制失败"); } };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">剧情导出</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {(["MARKDOWN","JSON","PROMPT"] as const).map(f => (
            <Button key={f} size="sm" variant={fmt === f ? "default" : "outline"} onClick={() => setFmt(f)}>{f}</Button>
          ))}
          <Button size="sm" onClick={copy}>复制</Button>
        </div>
        <Textarea readOnly value={content} rows={12} className="font-mono text-xs" />
      </CardContent>
    </Card>
  );
}
