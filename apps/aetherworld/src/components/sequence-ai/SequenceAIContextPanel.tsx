import type { SequenceAIContext } from "@/lib/sequence-ai/sequenceAIContextBuilder";
import { Badge } from "@/components/ui/badge";

export function SequenceAIContextPanel({ ctx }: { ctx: SequenceAIContext }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">主体：{ctx.subjectMode}</Badge>
        <Badge variant="outline">语言：{ctx.language}</Badge>
        <Badge variant="outline">用户层级：{ctx.userLevel}</Badge>
        {ctx.founderActive && <Badge variant="default">Founder Mode</Badge>}
      </div>
      {ctx.activeSequenceSummary && (
        <div className="text-muted-foreground">主体数列摘要：{ctx.activeSequenceSummary}</div>
      )}
      <div className="text-muted-foreground">可用引擎：{ctx.availableEngines.length} 个</div>
      {ctx.privacyNotes.map((n, i) => (
        <div key={i} className="text-amber-500">{n}</div>
      ))}
    </div>
  );
}
