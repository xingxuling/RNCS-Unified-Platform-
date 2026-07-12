import type { ObjectDynamicVariables } from "@/lib/objectDynamicVariableEngine";

export function ObjectDynamicVariablePanel({ dynamics }: { dynamics: ObjectDynamicVariables }) {
  const arrow = (d: string) => d === "UP" ? "↑" : d === "DOWN" ? "↓" : d === "STABLE" ? "→" : "?";
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Dynamic Variables · 动态变量</div>
      <div className="text-xs text-muted-foreground">最敏感变量：<span className="text-foreground/90">{dynamics.mostSensitiveVariable}</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {dynamics.variables.map(v => (
          <div key={v.name} className="rounded border border-border/40 px-2 py-1.5 flex items-center justify-between">
            <span>{v.name} <span className="text-muted-foreground">· {v.currentState}</span></span>
            <span className="text-foreground/80">{arrow(v.direction)} {(v.influenceLevel*100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
