import type { VocabularyTerm } from "@/lib/vocabulary/vocabularyRegistry";
import { getSafetyBoundary } from "@/lib/vocabulary/termSafetyBoundaryEngine";

export function TermSafetyBoundaryPanel({ term }: { term: VocabularyTerm }) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <h3 className="text-sm font-display mb-2">安全边界</h3>
      <p className="text-sm">{getSafetyBoundary(term)}</p>
      {term.commonMisuse?.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground space-y-1">
          {term.commonMisuse.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
    </div>
  );
}
