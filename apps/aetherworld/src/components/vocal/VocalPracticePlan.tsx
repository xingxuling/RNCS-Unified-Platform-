import type { VocalPracticePlan } from "@/lib/vocal/vocalPracticePlanner";

export function VocalPracticePlanCard({ plan }: { plan: VocalPracticePlan }) {
  const List = ({ title, items }: { title: string; items: string[] }) => (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <ul className="text-xs space-y-0.5 list-disc list-inside mt-1">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-sm font-medium">目标：{plan.goal}</div>
      <div className="text-xs text-muted-foreground">{plan.durationSuggestion}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <List title="热身" items={plan.warmup} />
        <List title="练习步骤" items={plan.practiceSteps} />
        <List title="避免行为" items={plan.riskyBehaviorsToAvoid} />
        <List title="恢复建议" items={plan.recoveryAdvice} />
      </div>
    </div>
  );
}
