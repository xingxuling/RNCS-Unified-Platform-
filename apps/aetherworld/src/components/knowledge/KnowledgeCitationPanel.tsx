import type { KnowledgeCitation } from "@/lib/knowledge/knowledgeSourceRegistry";
import { formatCitationLine } from "@/lib/knowledge/knowledgeCitationEngine";

export function KnowledgeCitationPanel({ citations, note }: { citations: KnowledgeCitation[]; note?: string }) {
  return (
    <div className="rounded-md border border-border/60 p-3 text-xs space-y-1.5">
      <div className="font-medium text-sm">引用</div>
      {citations.length === 0 ? (
        <div className="text-muted-foreground">没有引用来源。{note}</div>
      ) : (
        <ul className="space-y-1 list-disc list-inside text-muted-foreground">
          {citations.map((c, i) => <li key={i}>{formatCitationLine(c)}</li>)}
        </ul>
      )}
    </div>
  );
}
