import type { ContaminationRisk } from "@/lib/memoryContaminationDetector";

export function ContaminationRiskPanel({ risk }: { risk: ContaminationRisk }) {
  const color =
    risk.riskLevel === "HIGH" ? "border-amber-500/60 text-amber-300" :
    risk.riskLevel === "MEDIUM" ? "border-yellow-500/40 text-yellow-200" :
    "border-emerald-500/30 text-emerald-300";
  return (
    <div className={`aether-card p-5 border-l-2 ${color}`}>
      <div className="text-xs uppercase tracking-wider opacity-80">Contamination Risk · 污染风险</div>
      <div className="text-2xl font-display mt-1">{risk.riskLevel}</div>
      <p className="text-xs text-foreground/85 mt-2 leading-relaxed">{risk.explanation}</p>
      {risk.possibleSources.length > 0 && (
        <div className="text-[11px] text-muted-foreground mt-2">
          可能来源：{risk.possibleSources.join("、")}
        </div>
      )}
      <div className="text-[11px] text-muted-foreground mt-2">建议：{risk.recommendedAction}</div>
    </div>
  );
}
