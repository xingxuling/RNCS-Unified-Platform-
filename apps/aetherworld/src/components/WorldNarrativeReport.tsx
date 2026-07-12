import type { PersonalWorldResult } from "@/lib/personalWorldCalculus";

export function WorldNarrativeReport({ result }: { result: PersonalWorldResult }) {
  return (
    <div className="aether-card-elevated p-6">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Narrative Report · 世界叙事报告</div>
      <h2 className="font-display text-2xl gold-text mt-1">{result.worldName}</h2>
      <div className="text-sm text-muted-foreground">{result.worldSubtitle}</div>
      <div className="gold-divider my-4" />
      <p className="text-base text-foreground/95 leading-relaxed whitespace-pre-line">
        {result.narrativeSummary}
      </p>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <Block label="最适合的行动方式" value={result.actionStyle} />
        <Block label="最大风险" value={result.riskPattern} />
        <Block label="下一步建议" value={result.growthPath} accent />
      </div>
    </div>
  );
}

function Block({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20"}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-sm mt-1 leading-relaxed ${accent ? "text-primary" : "text-foreground/90"}`}>{value}</div>
    </div>
  );
}
