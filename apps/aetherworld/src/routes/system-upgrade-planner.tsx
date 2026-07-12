import { createFileRoute } from "@tanstack/react-router";
import { runMissingLayerDetection } from "@/lib/missing-layer/missingLayerDetectionCalculus";
import { UpgradeRecommendationPanel } from "@/components/missing-layer/UpgradeRecommendationPanel";

function Page() {
  const result = runMissingLayerDetection();
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">System Upgrade Planner</div>
        <h1 className="font-display text-2xl gold-text">系统升级规划</h1>
        <p className="text-sm text-muted-foreground">基于当前缺层评分生成的下一步升级建议（最多 5 条）。</p>
      </header>
      <UpgradeRecommendationPanel recs={result.recommendations} />
      <div className="aether-card p-3 text-xs">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">最终决策</div>
        <div className="mt-1 text-primary/90">{result.finalDecision}</div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/system-upgrade-planner")({
  head: () => ({ meta: [{ title: "System Upgrade Planner · 系统升级规划" }, { name: "description", content: "Aetherworld 下一步升级规划。" }] }),
  component: Page,
});
