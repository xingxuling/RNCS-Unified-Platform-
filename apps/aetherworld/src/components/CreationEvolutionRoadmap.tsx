import type { EvolutionRoadmap } from "@/lib/creationEvolutionPlanner";

export function CreationEvolutionRoadmap({ roadmap }: { roadmap: EvolutionRoadmap }) {
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Evolution Roadmap · 演化路径</div>
      <div className="text-xs text-foreground/80">{roadmap.potential}</div>
      <div className="space-y-1">
        {roadmap.milestones.map((m, i) => (
          <div key={i} className="text-xs border-l border-border/40 pl-3">
            <span className="text-primary">{m.stage}</span> · {m.goal}
          </div>
        ))}
      </div>
    </div>
  );
}
