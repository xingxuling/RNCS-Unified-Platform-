import { EVOLUTION_STAGES } from "@/constants/evolutionStages";
import { Sparkles } from "lucide-react";

export function EvolutionStageTimeline({ currentStageId }: { currentStageId: string }) {
  const idx = EVOLUTION_STAGES.findIndex(s => s.id === currentStageId);
  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Evolution Stage · 进化阶段</div>
      <div className="mt-3 space-y-2">
        {EVOLUTION_STAGES.map((s, i) => {
          const reached = i <= idx;
          const active = i === idx;
          return (
            <div key={s.id} className={`flex items-start gap-3 p-2 rounded ${active ? "bg-primary/10 border border-primary/30" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0
                ${reached ? "bg-primary/30 text-primary" : "bg-muted/30 text-muted-foreground"}`}>
                {active ? <Sparkles className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <div>
                <div className={`text-sm ${active ? "gold-text" : ""}`}>{s.name} <span className="text-[10px] text-muted-foreground">{s.en}</span></div>
                <div className="text-[11px] text-muted-foreground">≥ {s.minSignals} 信号 · {s.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
