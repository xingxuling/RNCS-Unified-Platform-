import type { AetherConcept } from "@/lib/weblcm/webLcmTypes";

export function WebLcmConceptExtractorPanel({ concepts }: { concepts: AetherConcept[] }) {
  if (concepts.length === 0) {
    return <div className="text-xs text-muted-foreground p-3 rounded border border-border/40">尚未抽取概念。请在左侧输入文本后点击「抽取概念」。</div>;
  }
  return (
    <div className="space-y-2">
      {concepts.map(c => (
        <div key={c.conceptId} className="rounded border border-border/40 p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{c.title}</span>
            <span className="text-muted-foreground">{c.conceptType} · conf {c.confidence.toFixed(2)}</span>
          </div>
          <div className="text-muted-foreground">{c.summary}</div>
          {c.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {c.keywords.map(k => <span key={k} className="px-1.5 py-0.5 rounded bg-muted/40 text-[10px]">{k}</span>)}
            </div>
          )}
          {c.safetyNotes.length > 0 && (
            <div className="text-[10px] text-amber-500">⚠ {c.safetyNotes.join(" / ")}</div>
          )}
        </div>
      ))}
    </div>
  );
}
