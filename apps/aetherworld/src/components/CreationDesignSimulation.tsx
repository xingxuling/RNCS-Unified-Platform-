export function CreationDesignSimulation({ recommendations, prototypePath, validationPlan }: {
  recommendations: string[]; prototypePath: string[]; validationPlan: string[];
}) {
  return (
    <div className="aether-card p-5 space-y-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Design Simulation · 设计推演</div>
      <Block title="设计建议" items={recommendations} />
      <Block title="第一原型路径" items={prototypePath} />
      <Block title="验证计划" items={validationPlan} />
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs text-foreground">{title}</div>
      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
        {items.map((s, i) => <li key={i}>· {s}</li>)}
      </ul>
    </div>
  );
}
