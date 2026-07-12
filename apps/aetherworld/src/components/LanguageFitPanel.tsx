import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { LanguageFitResult } from "@/lib/productUserLanguageEngine";

const BAND_TONE: Record<LanguageFitResult["jargonDensityBand"], string> = {
  EASY: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  ACCEPTABLE: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  HARD: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  EXTREME: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function LanguageFitPanel({ result }: { result: LanguageFitResult }) {
  return (
    <Card className="p-5 space-y-4 aether-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Language Fit Score</div>
          <div className="text-3xl font-display gold-text">{result.fitScore}</div>
        </div>
        <Badge variant="outline" className={BAND_TONE[result.jargonDensityBand]}>
          密度 {result.jargonDensity} · {result.jargonDensityBand}
        </Badge>
      </div>
      <Progress value={result.fitScore} className="h-2" />
      <div className="text-xs text-muted-foreground">
        推荐语言层级：<span className="text-foreground">{result.recommendedLevel}</span>
      </div>
      {result.suggestions.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
    </Card>
  );
}
