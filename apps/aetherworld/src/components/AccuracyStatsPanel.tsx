import type { AccuracyReport } from "@/lib/predictionAccuracyCalculator";
import { sampleTierMessage } from "@/lib/predictionAccuracyCalculator";
import { ACCURACY_DIMENSIONS } from "@/constants/accuracyMetrics";

interface Props {
  report: AccuracyReport;
}

export function AccuracyStatsPanel({ report }: Props) {
  const { dimensions, overall, target, gapToTarget, sampleTier, totalRecords, validRecords, canClaimPublicly, trend } = report;

  return (
    <div className="aether-card p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Accuracy Stats · 回验有效率
          </div>
          <h2 className="font-display text-lg mt-0.5">当前实证回验有效率</h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">综合有效率</div>
          <div className={`font-display text-3xl ${overall >= target.min ? "gold-text" : "text-foreground"}`}>
            {validRecords === 0 ? "—" : `${overall}%`}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            目标区间 {target.label}
            {validRecords > 0 && (
              <span className={`ml-2 font-mono ${gapToTarget >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                {gapToTarget >= 0 ? "+" : ""}{gapToTarget}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI 行 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="累计回验" value={totalRecords} />
        <KPI label="有效回验" value={validRecords} />
        <KPI label="样本分层" value={
          sampleTier === "insufficient" ? "样本不足" :
          sampleTier === "early" ? "早期校准" : "趋势可读"
        } />
        <KPI label="可对外宣传" value={canClaimPublicly ? "允许" : "暂不允许"} accent={canClaimPublicly} />
      </div>

      {/* 提示文案 */}
      <div className={`text-xs rounded-md p-3 border ${
        sampleTier === "ready" ? "border-primary/30 bg-primary/5 text-primary" :
        sampleTier === "early" ? "border-amber-500/30 bg-amber-500/5 text-amber-300" :
        "border-destructive/30 bg-destructive/5 text-destructive"
      }`}>
        {sampleTierMessage(sampleTier)}
        {!canClaimPublicly && validRecords > 0 && (
          <span className="ml-2 text-muted-foreground">
            未达到对外宣传阈值（样本 ≥ 100 且综合 ≥ 90%），不应在产品页声称已达到 {target.label}。
          </span>
        )}
      </div>

      {/* 维度明细 */}
      <div className="space-y-2">
        {ACCURACY_DIMENSIONS.filter((d) => d.id !== "overall").map((d) => {
          const s = dimensions[d.id];
          return (
            <div key={d.id}>
              <div className="flex justify-between text-xs">
                <span>
                  <span className="font-display">{d.name}</span>
                  <span className="text-muted-foreground ml-2 text-[10px]">{d.en}</span>
                </span>
                <span className="font-mono text-muted-foreground">
                  {s.total === 0 ? "—" : `${s.hit}/${s.total} · ${s.rate}%`}
                </span>
              </div>
              <div className="h-1.5 bg-muted/40 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full ${s.rate >= target.min ? "bg-primary" : s.rate >= 70 ? "bg-amber-400/70" : "bg-destructive/70"}`}
                  style={{ width: `${s.rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 趋势 */}
      {trend && trend.length > 1 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Rolling Trend · 滚动综合有效率（每 10 条窗口）
          </div>
          <div className="flex items-end gap-1 h-20">
            {trend.map((t, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/40 rounded-t"
                style={{ height: `${Math.max(4, t.rate)}%` }}
                title={`${t.date} · ${t.rate}%`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 方向 vs 时间 提示 */}
      {validRecords >= 30 && dimensions.direction.rate >= 80 && dimensions.timing_window.rate < 60 && (
        <div className="text-xs rounded-md p-3 border border-amber-500/30 bg-amber-500/5 text-amber-300">
          系统更适合判断方向与行动许可，而非精确单日断言。建议以 ±3 / ±7 日窗口理解时间预测。
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/10"}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-xl mt-1 ${accent ? "gold-text" : ""}`}>{value}</div>
    </div>
  );
}
