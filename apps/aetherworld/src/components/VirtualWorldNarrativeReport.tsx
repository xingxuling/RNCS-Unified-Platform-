import type { WorldNarrativeReport } from "@/lib/worldNarrativeCompiler";

export function VirtualWorldNarrativeReport({ report }: { report: WorldNarrativeReport }) {
  return (
    <div className="aether-card-elevated p-6">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Narrative Report · 虚拟世界叙事报告</div>
      <h2 className="font-display text-2xl gold-text mt-1">{report.title}</h2>
      <div className="text-sm text-muted-foreground">{report.subtitle}</div>
      <div className="gold-divider my-4" />
      <p className="text-base text-foreground/95 leading-relaxed">{report.openingParagraph}</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <Block label="角色" value={report.characterSummary} />
        <Block label="法则" value={report.worldLawsSummary} />
        <Block label="地图" value={report.mapSummary} />
        <Block label="任务" value={report.questSummary} />
        <Block label="NPC" value={report.npcSummary} />
        <Block label="风险" value={report.riskSummary} />
      </div>
      <div className="mt-4 aether-card p-3 border-l-2 border-primary/50">
        <div className="text-[10px] uppercase tracking-wider text-primary">下一步建议</div>
        <div className="text-sm text-foreground/95 mt-1">{report.nextAction}</div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-4 whitespace-pre-line leading-relaxed">{report.safetyNote}</p>
    </div>
  );
}
function Block({ label, value }: { label: string; value: string }) {
  return (
    <div className="aether-card p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-foreground/90 mt-1 leading-snug">{value}</div>
    </div>
  );
}
