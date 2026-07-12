import type { CollectiveMemoryState } from "@/lib/sequence-world/society/collectiveMemoryEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CollectiveMemoryPanel({ memory }: { memory: CollectiveMemoryState }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">集体记忆 · Collective Memory</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-xs text-muted-foreground">{memory.dominantHistoricalNarrative}</div>
        <div className="space-y-1">
          {memory.sharedMemories.slice(0, 12).map(m => (
            <div key={m.memoryId} className="rounded border px-2 py-1 text-xs">
              <div className="font-medium">{m.title}</div>
              <div className="text-muted-foreground">{m.summary}</div>
              <div className="text-[10px] text-muted-foreground">情感 {(m.emotionalWeight*100).toFixed(0)}%｜政治 {(m.politicalImpact*100).toFixed(0)}%｜神话 {(m.mythicImpact*100).toFixed(0)}%｜{m.canonLevel}</div>
            </div>
          ))}
        </div>
        {memory.contestedMemories.length > 0 && (
          <div className="text-xs text-amber-300">争议记忆：{memory.contestedMemories.join("、")}</div>
        )}
        {memory.forgottenEvents.length > 0 && (
          <div className="text-xs text-muted-foreground">遗忘事件：{memory.forgottenEvents.join("、")}</div>
        )}
      </CardContent>
    </Card>
  );
}
