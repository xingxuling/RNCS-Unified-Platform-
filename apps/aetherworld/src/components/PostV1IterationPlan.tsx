interface Props {
  roadmap: string[];
}

export function PostV1IterationPlan({ roadmap }: Props) {
  return (
    <div className="aether-card p-5 space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Post-v1 Iteration · v1.0 之后的迭代
        </div>
        <h3 className="font-display text-xl mt-1">下一阶段路线</h3>
        <p className="text-xs text-muted-foreground mt-1">
          v1.1 / v1.2 / v1.3 / v1.4 / v1.5 / v2.0 — 一次结构性升级，而非堆功能。
        </p>
      </div>
      <ol className="space-y-2">
        {roadmap.map((line, idx) => (
          <li key={idx} className="aether-card p-3 text-xs leading-relaxed">
            <span className="font-display text-primary mr-2">{String(idx + 1).padStart(2, "0")}</span>
            {line}
          </li>
        ))}
      </ol>
    </div>
  );
}
