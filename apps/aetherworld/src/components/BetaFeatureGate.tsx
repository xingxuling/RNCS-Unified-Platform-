import type { BetaFeatureGateGroup } from "@/lib/betaLaunchCalculus";
import { Lock, Unlock, ShieldQuestion, BookMarked, Sparkles } from "lucide-react";

interface Props {
  gates: BetaFeatureGateGroup[];
}

const META: Record<
  BetaFeatureGateGroup["id"],
  { tone: string; icon: typeof Lock; tag: string }
> = {
  ALWAYS_OPEN: { tone: "border-emerald-500/40 text-emerald-400", icon: Unlock, tag: "OPEN" },
  ALPHA_ONLY: { tone: "border-primary/50 text-primary", icon: Sparkles, tag: "ALPHA" },
  TRUSTED_ONLY: { tone: "border-amber-500/50 text-amber-400", icon: ShieldQuestion, tag: "TRUSTED" },
  RESEARCH_ONLY: { tone: "border-sky-500/40 text-sky-400", icon: BookMarked, tag: "RESEARCH" },
  RESTRICTED: { tone: "border-destructive/60 text-destructive", icon: Lock, tag: "LOCKED" },
};

export function BetaFeatureGate({ gates }: Props) {
  return (
    <div className="aether-card p-5 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beta Feature Gate</div>
        <div className="font-display text-lg gold-text">功能开放矩阵</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {gates.map((g) => {
          const m = META[g.id];
          const Icon = m.icon;
          return (
            <div key={g.id} className={`rounded-md border ${m.tone} bg-secondary/20 p-3 space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <div className="font-display text-sm">{g.label}</div>
                </div>
                <span className="text-[10px] tracking-widest opacity-80">{m.tag}</span>
              </div>
              <ul className="space-y-1">
                {g.features.map((f) => (
                  <li key={f} className="text-[11px] text-muted-foreground">· {f}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
