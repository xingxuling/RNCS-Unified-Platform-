import type { VocabularyTerm } from "@/lib/vocabulary/vocabularyRegistry";
import { getOrGenerateExamples } from "@/lib/vocabulary/termUsageExampleEngine";

export function TermUsageExamplePanel({ term }: { term: VocabularyTerm }) {
  const exs = getOrGenerateExamples(term);
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-2">
      <h3 className="text-sm font-display">使用示例</h3>
      {exs.map((e) => (
        <div key={e.exampleId} className="rounded border border-border/40 p-2 text-xs">
          <div className="text-muted-foreground">场景：{e.inputContext}</div>
          <div className="mt-1 text-green-500">✓ {e.correctUsage}</div>
          {e.incorrectUsage && <div className="text-red-400">✗ {e.incorrectUsage}</div>}
        </div>
      ))}
    </div>
  );
}
