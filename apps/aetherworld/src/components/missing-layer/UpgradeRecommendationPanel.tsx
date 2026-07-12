import type { SystemUpgradeRecommendation } from "@/lib/missing-layer/nextUpgradePlanner";
import { UPGRADE_RECOMMENDATION_LABELS } from "@/constants/missing-layer/upgradeRecommendationTypes";

export function UpgradeRecommendationPanel({ recs }: { recs: SystemUpgradeRecommendation[] }) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">推荐升级 · Next Upgrade</div>
      {recs.length === 0 && <div className="text-xs text-muted-foreground">暂无推荐</div>}
      <div className="space-y-2">
        {recs.map(r => (
          <div key={r.recommendationId} className="border border-border/40 rounded p-3 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.title}</span>
              <span className={`text-[10px] ${r.priority === "CRITICAL" ? "text-red-400" : r.priority === "HIGH" ? "text-amber-400" : "text-muted-foreground"}`}>{r.priority}</span>
            </div>
            <div className="text-muted-foreground">{r.reason}</div>
            <div className="text-[10px] text-primary/80">{UPGRADE_RECOMMENDATION_LABELS[r.recommendationType]} · 目标层 {r.targetLayer} · 复杂度 {r.estimatedComplexity}</div>
            {r.actionPlan.length > 0 && (
              <ul className="text-[10px] text-muted-foreground list-disc pl-4 space-y-0.5">
                {r.actionPlan.slice(0, 4).map((p, i) => (<li key={i}>{p}</li>))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
