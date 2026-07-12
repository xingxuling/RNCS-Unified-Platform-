import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { LanguageFitResult } from "@/lib/productUserLanguageEngine";

export function JargonDensityMeter({ result }: { result: LanguageFitResult }) {
  return (
    <Card className="p-5 space-y-3 aether-card">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Jargon Density · 术语密度</div>
        <Badge variant="outline">{result.jargonDensityBand}</Badge>
      </div>
      <div className="text-3xl font-display gold-text">{result.jargonDensity}<span className="text-sm text-muted-foreground ml-1">/100</span></div>
      <Progress value={result.jargonDensity} className="h-2" />
      <div className="text-xs text-muted-foreground">
        检测到术语 {result.detectedTerms.length} 个 · 高风险 {result.highRiskTerms.length} 个 · 需替换：{result.needsRewrite ? "是" : "否"} · 需 tooltip：{result.needsTooltip ? "是" : "否"}
      </div>
      {result.detectedTerms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {result.detectedTerms.map((d) => (
            <Badge key={d.term} variant="outline" className="text-[10px]">
              {d.term} ×{d.occurrences} · {d.entry.jargonRisk}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
