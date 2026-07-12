import type { BetaLaunchResult } from "@/lib/betaLaunchCalculus";
import { BETA_STATUS_META } from "@/lib/betaLaunchCalculus";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Props {
  result: BetaLaunchResult;
}

export function BetaReadinessPanel({ result }: Props) {
  const meta = BETA_STATUS_META[result.recommendedStatus];
  return (
    <div className="aether-card p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beta Readiness</div>
          <div className="font-display text-xl gold-text">内测成熟度</div>
          <div className="text-xs text-muted-foreground mt-1">综合产品成熟度、回验闭环、隐私安全、误用风险、文档完整度等多维度。</div>
        </div>
        <div className="text-right">
          <div className="font-display text-4xl gold-text leading-none">{result.betaReadinessScore}</div>
          <div className="text-[10px] text-muted-foreground mt-1">/ 100</div>
        </div>
      </div>

      <Progress value={result.betaReadinessScore} className="h-2" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <Stat label="正向因子指数" value={`${result.positiveIndex} / 100`} />
        <Stat label="负向因子指数" value={`${result.negativeIndex} / 100`} />
        <Stat label="推荐阶段" value={`${meta.cn} · ${meta.en}`} accent />
        <Stat
          label="公开发布是否阻断"
          value={result.publicLaunchBlocked ? "已阻断" : "未阻断"}
          danger={result.publicLaunchBlocked}
        />
      </div>

      <div className="rounded-md border border-border bg-secondary/20 p-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">下一步建议</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{result.nextMilestone}</div>
      </div>

      {result.notes.length > 0 && (
        <div className="space-y-1.5">
          {result.notes.map((n, i) => (
            <div key={i} className="text-[11px] text-muted-foreground leading-relaxed">· {n}</div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-border text-muted-foreground">
          推荐状态：{meta.cn}
        </Badge>
        <Badge variant="outline" className="border-border text-muted-foreground">
          推荐用户群 {result.recommendedUserSegments.length} 个
        </Badge>
        <Badge variant="outline" className="border-border text-muted-foreground">
          推荐访问等级 {result.recommendedAccessLevels.length} 个
        </Badge>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, danger }: { label: string; value: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-sm mt-0.5 ${accent ? "gold-text" : danger ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
