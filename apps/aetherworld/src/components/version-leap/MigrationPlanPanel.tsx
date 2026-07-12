import type { MigrationPlan } from "@/lib/version-leap/versionMigrationPlanner";

export function MigrationPlanPanel({ plan }: { plan: MigrationPlan }) {
  return (
    <div className="border border-border/40 rounded-md p-4 bg-muted/10 space-y-3">
      <div className="text-xs text-muted-foreground">
        {plan.fromVersion} <span className="mx-1">→</span> <span className="font-mono">{plan.toVersion}</span>
        {plan.rollbackAvailable ? " · 可回滚" : " · 不可回滚"}
      </div>
      <ol className="space-y-2 text-sm">
        {plan.steps.map((s, i) => (
          <li key={s.stepId} className="flex items-start gap-2">
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{i + 1}</span>
            <div>
              <p className="font-medium">{s.title} {s.required && <span className="text-[10px] text-rose-500 ml-1">必须</span>}</p>
              <p className="text-xs text-muted-foreground">{s.description} · 模块 {s.relatedModule}</p>
            </div>
          </li>
        ))}
      </ol>
      {plan.risks.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1 text-amber-600">风险</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
            {plan.risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
