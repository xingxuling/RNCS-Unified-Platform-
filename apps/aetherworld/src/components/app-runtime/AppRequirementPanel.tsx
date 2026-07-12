import type { AppRequirementObject } from "@/lib/app-runtime/appProjectObjectEngine";

export function AppRequirementPanel({ req }: { req: AppRequirementObject }) {
  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Product Requirement</div>
      <div className="text-sm">{req.productSummary}</div>
      <div>
        <div className="text-[11px] text-muted-foreground mb-1">MVP 功能</div>
        <ul className="space-y-1">
          {req.mvpFeatures.map(f => (
            <li key={f.featureId} className="text-sm border border-border/30 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{f.title}</span>
                <span className="text-[10px] text-muted-foreground">{f.priority}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{f.userValue}</div>
              <ul className="text-[11px] text-muted-foreground list-disc pl-4 mt-1">
                {f.acceptanceCriteria.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </div>
      <div className="text-[11px] text-muted-foreground">
        <div>Non-goals</div>
        <ul className="list-disc pl-4">{req.nonGoals.map((n, i) => <li key={i}>{n}</li>)}</ul>
      </div>
    </div>
  );
}
