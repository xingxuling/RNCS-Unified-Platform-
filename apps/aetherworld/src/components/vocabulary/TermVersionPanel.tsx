import type { VocabularyTerm } from "@/lib/vocabulary/vocabularyRegistry";
import { getTermVersionHistory } from "@/lib/vocabulary/termVersioningEngine";

export function TermVersionPanel({ term }: { term: VocabularyTerm }) {
  const history = getTermVersionHistory(term);
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4">
      <h3 className="text-sm font-display mb-2">版本记录</h3>
      <ul className="space-y-1 text-xs">
        {history.map((h, i) => (
          <li key={i}>v{h.version} · {h.updatedAt} · {h.changeType} — {h.note}</li>
        ))}
      </ul>
    </div>
  );
}
