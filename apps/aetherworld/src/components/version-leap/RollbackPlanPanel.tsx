import type { RollbackPlan } from "@/lib/version-leap/versionRollbackPlanner";

export function RollbackPlanPanel({ plan }: { plan: RollbackPlan }) {
  return (
    <div className="border border-border/40 rounded-md p-4 bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm">目标版本 <span className="font-mono">{plan.targetVersion}</span></span>
        <span className={`text-xs ${plan.safeToRollback ? "text-emerald-600" : "text-rose-600"}`}>
          {plan.safeToRollback ? "可安全回滚" : "回滚需 Founder 审批"}
        </span>
      </div>
      <ol className="text-sm space-y-1 list-decimal list-inside">
        {plan.rollbackSteps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
      {plan.dataRisk.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1 text-rose-600">数据风险</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
            {plan.dataRisk.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
