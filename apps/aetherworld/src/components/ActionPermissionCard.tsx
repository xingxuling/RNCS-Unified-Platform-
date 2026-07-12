import type { ActionPermissionResult } from "@/lib/actionPermissionResolver";
import { ACTION_EXPLANATIONS } from "@/constants/breakthroughActionTypes";

export function ActionPermissionCard({ data }: { data: ActionPermissionResult }) {
  return (
    <section className="aether-card-elevated p-5 space-y-3">
      <h3 className="font-display text-base gold-text">行动许可 · Action Permission</h3>
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded bg-primary/15 text-primary text-sm font-medium">
          主动作：{data.primaryAction}
        </span>
        <span className="text-[11px] text-muted-foreground">{ACTION_EXPLANATIONS[data.primaryAction]}</span>
      </div>
      <div className="text-xs">
        <span className="text-muted-foreground">次动作：</span>
        {data.secondaryActions.length ? data.secondaryActions.join(" · ") : "—"}
      </div>
      <div className="text-xs">
        <span className="text-muted-foreground">不建议：</span>
        {data.forbiddenActions.length ? data.forbiddenActions.join(" · ") : "—"}
      </div>
      <div className="text-xs text-muted-foreground border-t border-border/60 pt-2">
        理由：{data.reason}
      </div>
      <div className="text-xs flex justify-between">
        <span>建议执行时机：{data.timing}</span>
        <span>风险：<span className={data.riskLevel === "高" ? "text-destructive" : data.riskLevel === "中" ? "text-amber-500" : "text-emerald-500"}>{data.riskLevel}</span></span>
      </div>
    </section>
  );
}
