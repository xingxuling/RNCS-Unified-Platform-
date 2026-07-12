import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  VERSION_STATUS_META,
  type VersionReadinessResult,
} from "@/lib/versionIterationCalculus";

interface Props {
  result: VersionReadinessResult;
}

export function VersionReadinessPanel({ result }: Props) {
  const meta = VERSION_STATUS_META[result.releaseStatus];
  return (
    <div className="aether-card-elevated p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Version Readiness · 版本成熟度
          </div>
          <div className="flex items-end gap-3 mt-1">
            <div className="font-display text-5xl gold-text leading-none">
              {result.versionReadinessScore}
            </div>
            <div className="text-sm text-muted-foreground pb-1">/ 100</div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            正向指数 {result.positiveIndex} · 负向指数 {result.negativeIndex}
          </div>
        </div>
        <div className="text-right space-y-2">
          <Badge variant="outline" className="text-[11px] tracking-wider">
            {meta.en}
          </Badge>
          <div className="text-sm font-medium">{meta.cn}</div>
          <div className="text-xs text-muted-foreground max-w-[260px]">{meta.desc}</div>
          <Badge
            variant="outline"
            className={
              result.canMarkAsV1
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/15 text-amber-300 border-amber-500/30"
            }
          >
            {result.canMarkAsV1 ? "可标记为 v1.0" : "暂不可标记 v1.0"}
          </Badge>
        </div>
      </div>

      <Progress value={result.versionReadinessScore} className="h-2" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <Stat label="推荐版本" value={result.recommendedVersion} />
        <Stat
          label="Beta 状态"
          value={`${result.betaSnapshot.status} · ${result.betaSnapshot.score}`}
        />
        <Stat
          label="发布阻断"
          value={result.releaseBlockers.length ? `${result.releaseBlockers.length} 项` : "无"}
          tone={result.releaseBlockers.length ? "warn" : "ok"}
        />
      </div>

      <div className="aether-card p-4 text-xs text-muted-foreground leading-relaxed">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          推荐内测范围
        </div>
        {result.recommendedBetaScope}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn";
}) {
  const toneClass =
    tone === "ok"
      ? "text-emerald-300"
      : tone === "warn"
      ? "text-amber-300"
      : "text-foreground";
  return (
    <div className="aether-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-medium ${toneClass}`}>{value}</div>
    </div>
  );
}
