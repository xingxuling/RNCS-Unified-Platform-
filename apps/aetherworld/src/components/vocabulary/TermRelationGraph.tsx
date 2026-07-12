import { buildTermRelations } from "@/lib/vocabulary/termRelationEngine";
import { getTermById } from "@/lib/vocabulary/vocabularyRegistry";
import { TERM_RELATION_TYPES } from "@/constants/vocabulary/termRelationTypes";

export function TermRelationGraph({ filterTermId }: { filterTermId?: string }) {
  const rels = buildTermRelations().filter(
    (r) => !filterTermId || r.fromTermId === filterTermId || r.toTermId === filterTermId,
  );
  const typeLabel = (id: string) => TERM_RELATION_TYPES.find((t) => t.id === id)?.label ?? id;
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4">
      <h3 className="text-sm font-display mb-3">词汇关系图（{rels.length} 条关系）</h3>
      <ul className="space-y-1 text-sm max-h-[420px] overflow-auto">
        {rels.slice(0, 200).map((r) => {
          const from = getTermById(r.fromTermId), to = getTermById(r.toTermId);
          return (
            <li key={r.relationId} className="flex items-center gap-2 text-xs">
              <span className="text-foreground">{from?.chineseTerm ?? r.fromTermId}</span>
              <span className="px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{typeLabel(r.relationType)}</span>
              <span className="text-foreground">{to?.chineseTerm ?? r.toTermId}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
