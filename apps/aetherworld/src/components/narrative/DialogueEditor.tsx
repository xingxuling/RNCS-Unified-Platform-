import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DialogueResult } from "@/lib/narrative/dialogueEngine";
import { Badge } from "@/components/ui/badge";

export function DialogueEditor({ dialogue }: { dialogue: DialogueResult }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">对白</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-xs text-muted-foreground">风格：{dialogue.dialogueStyle} ｜ 推进：{dialogue.conflictProgression}</div>
        {dialogue.dialogueLines.map((l, i) => (
          <div key={i} className="border-l-2 pl-2">
            <div><Badge variant="outline" className="mr-2">{l.speaker}</Badge>{l.line}</div>
            <div className="text-[11px] text-muted-foreground">潜台词：{l.subtext} ｜ 情绪：{l.emotion}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
