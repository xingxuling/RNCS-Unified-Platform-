import { Link } from "@tanstack/react-router";
import type { VocabularyTerm } from "@/lib/vocabulary/vocabularyRegistry";

export function TermCard({ term }: { term: VocabularyTerm }) {
  return (
    <Link
      to="/vocabulary-entry"
      search={{ id: term.termId } as any}
      className="block rounded-lg border border-border/60 bg-card/40 p-4 hover:border-primary/50 hover:bg-card/60 transition"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-display">{term.chineseTerm}</h3>
        <span className="text-xs text-muted-foreground">{term.englishTerm}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{term.shortDefinition}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
        <span className="px-1.5 py-0.5 rounded bg-muted/40">{term.category}</span>
        <span className="px-1.5 py-0.5 rounded bg-muted/40">{term.systemLayer}</span>
        <span className="px-1.5 py-0.5 rounded bg-muted/40">{term.maturity}</span>
        {term.founderLocked && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">Founder</span>
        )}
      </div>
    </Link>
  );
}
