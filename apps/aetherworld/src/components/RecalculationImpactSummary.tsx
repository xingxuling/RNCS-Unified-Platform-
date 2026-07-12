import { useMemo } from "react";
import { useAetherData } from "@/lib/useAetherData";
import { loadLogs } from "@/lib/globalRecalculationEngine";
import { RECALC_MODULES } from "@/constants/recalculationScopes";

export function RecalculationImpactSummary() {
  const { active, feedback } = useAetherData();
  const logs = useMemo(() => loadLogs(), [active, feedback]);
  const latest = logs[0];

  if (!latest) {
    return (
      <div className="aether-card p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Impact Summary · 影响摘要
        </div>
        <h2 className="font-display text-lg mt-0.5">尚未执行重算</h2>
        <p className="text-sm text-muted-foreground mt-2">
          执行任意范围的重算后，这里将显示本次重算前后的关键变化、风险升降与是否需复核。
        </p>
      </div>
    );
  }

  return (
    <div className="aether-card p-6 space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Impact Summary · 上次重算影响摘要
        </div>
        <h2 className="font-display text-lg mt-0.5">本次重算共影响 {latest.affectedModules.length} 个模块</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {latest.affectedModules.map((m) => (
          <div key={m} className="rounded-md border border-border bg-secondary/10 p-2">
            <div className="text-xs font-display">{RECALC_MODULES[m].cn}</div>
            <div className="text-[10px] text-muted-foreground">{RECALC_MODULES[m].en}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground leading-relaxed">
        {latest.beforeSummary}
        <br />→ {latest.afterSummary}
      </div>

      {latest.status === "NEEDS_REVIEW" && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-amber-300 text-xs">
          重算完成但存在需要复核的变化。请重新查看预测详情与定数判断。
        </div>
      )}
    </div>
  );
}
