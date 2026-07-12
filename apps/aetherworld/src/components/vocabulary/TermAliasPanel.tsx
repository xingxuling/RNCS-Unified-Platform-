import { allAliases } from "@/lib/vocabulary/termAliasEngine";
import { getTermById } from "@/lib/vocabulary/vocabularyRegistry";

export function TermAliasPanel() {
  const aliases = allAliases();
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4">
      <h3 className="text-sm font-display mb-3">别名总表（{aliases.length}）</h3>
      <ul className="text-xs space-y-1 max-h-[360px] overflow-auto">
        {aliases.map((a, i) => {
          const term = getTermById(a.termId);
          return <li key={i}><span className="text-muted-foreground">{a.alias}</span> → {term?.chineseTerm}</li>;
        })}
      </ul>
    </div>
  );
}
