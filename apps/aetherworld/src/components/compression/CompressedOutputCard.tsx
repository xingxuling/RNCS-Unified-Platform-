import type { CompressedOutput } from "@/lib/compression/hybridCompressionEngine";

export function CompressedOutputCard({ output }: { output: CompressedOutput }) {
  return (
    <section className="rounded-md border border-border/60 p-4 space-y-3">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{output.title}</h3>
        <span className="text-[10px] text-muted-foreground">
          {output.compressionLevel} · {output.audienceType}
        </span>
      </header>
      <p className="text-sm leading-relaxed">{output.plainConclusion}</p>
      {output.shortReason && (
        <p className="text-xs text-muted-foreground">原因：{output.shortReason}</p>
      )}

      {output.keySignals && output.keySignals.length > 0 && (
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">黑箱信号摘要</h4>
          <ul className="text-xs space-y-0.5 list-disc list-inside">
            {output.keySignals.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {output.visibleEvidence && output.visibleEvidence.length > 0 && (
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">白箱依据</h4>
          <ul className="text-xs space-y-0.5 list-disc list-inside">
            {output.visibleEvidence.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">下一步</h4>
          <ol className="text-xs space-y-0.5 list-decimal list-inside">
            {output.nextActions.map((a, i) => <li key={i}>{a}</li>)}
          </ol>
        </div>
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">如何验证</h4>
          <ul className="text-xs space-y-0.5 list-disc list-inside">
            {output.validationPoints.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </div>
      </div>

      {output.riskNotes.length > 0 && (
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">风险提醒</h4>
          <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5 list-disc list-inside">
            {output.riskNotes.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
