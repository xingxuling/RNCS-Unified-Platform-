import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAetherData } from "@/lib/useAetherData";
import { computeTrigger } from "@/lib/predictionEngine";
import { computeDimensionRanking } from "@/lib/predictionDimensionEngine";
import { PredictionDimensionPanel } from "@/components/PredictionDimensionPanel";
import { DimensionEventMap } from "@/components/DimensionEventMap";

export const Route = createFileRoute("/prediction-dimensions")({ component: DimensionsPage });

function DimensionsPage() {
  const { active } = useAetherData();

  const ranking = useMemo(() => {
    if (!active) return null;
    const today = new Date().toISOString().slice(0, 10);
    const trigger = computeTrigger(active, today);
    return computeDimensionRanking({
      subject: active,
      trigger,
      focusHint: active.focuses ?? [],
    });
  }, [active]);

  return (
    <>
      <PageHeader
        caption="Prediction Dimension Engine · 预测维度引擎"
        title="预测维度"
        subtitle="判断当前预测属于哪个人生/产品/现实维度，并标记主维度与副维度。"
      />
      <div className="p-6 md:p-10 space-y-6">
        {ranking ? (
          <PredictionDimensionPanel ranking={ranking} />
        ) : (
          <div className="aether-card p-6 text-sm text-muted-foreground">请先选择或导入主体后查看维度评估。</div>
        )}
        <DimensionEventMap />
      </div>
    </>
  );
}
