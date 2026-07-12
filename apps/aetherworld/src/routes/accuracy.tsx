import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAetherData } from "@/lib/useAetherData";
import { calculateAccuracy } from "@/lib/predictionAccuracyCalculator";
import { AccuracyDefinitionCard } from "@/components/AccuracyDefinitionCard";
import { AccuracyStatsPanel } from "@/components/AccuracyStatsPanel";
import { AccuracyDisclaimer } from "@/components/AccuracyDisclaimer";
import { CONFIDENCE_TIERS } from "@/constants/accuracyMetrics";

export const Route = createFileRoute("/accuracy")({ component: AccuracyPage });

function AccuracyPage() {
  const { active, feedback } = useAetherData();
  const report = useMemo(() => calculateAccuracy(feedback), [feedback]);

  return (
    <>
      <PageHeader
        caption="Accuracy · 预测有效率"
        title="理论目标 · 实证回验 · 个体校准"
        subtitle="区分目标区间与已验证准确率，避免对外宣传与个体期望的错位。"
      />

      <div className="p-6 md:p-10 space-y-6">
        <AccuracyDisclaimer hasEnoughSamples={report.canClaimPublicly} />
        <AccuracyDefinitionCard />

        {!active ? (
          <div className="aether-card p-6 text-sm text-muted-foreground">
            请先在「主体模型」中选择或创建主体，才能查看个体回验有效率。
          </div>
        ) : (
          <AccuracyStatsPanel report={report} />
        )}

        <div className="aether-card p-6">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Confidence Tiers · 置信层级
          </div>
          <h2 className="font-display text-lg mt-0.5">预测详情页统一置信表达</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {CONFIDENCE_TIERS.map((t) => (
              <div key={t.id} className="rounded-md border border-border bg-secondary/10 p-3">
                <div className="font-display text-sm">{t.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t.en}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
            预测详情页不再使用「必然发生 / 直接照做 / 系统保证命中」等表述，
            统一使用「该方向具有高置信度，请结合现实信息、行动许可与后续回验使用」。
          </p>
        </div>
      </div>
    </>
  );
}
