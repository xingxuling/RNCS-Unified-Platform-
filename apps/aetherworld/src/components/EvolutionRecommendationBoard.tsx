import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { EvolutionMutation } from "@/constants/evolutionMutationTypes";
import { EvolutionMutationPreview } from "./EvolutionMutationPreview";
import { checkMutationSafety } from "@/lib/evolutionSafetyGuard";
import { useFounderState } from "@/hooks/useFounderState";

interface Props {
  recommendations: { mutation: EvolutionMutation; userFacingText: string; founderText: string; canApply: boolean }[];
  onApply: (m: EvolutionMutation) => void;
  onIgnore: (m: EvolutionMutation) => void;
  founderView?: boolean;
}

export function EvolutionRecommendationBoard({ recommendations, onApply, onIgnore, founderView }: Props) {
  const [preview, setPreview] = useState<EvolutionMutation | null>(null);
  const { active: founder } = useFounderState();

  if (recommendations.length === 0) {
    return (
      <div className="aether-card p-5 text-center text-sm text-muted-foreground">
        当前没有进化建议。继续使用产品，系统会在本地观察你的偏好并给出建议。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map(r => {
        const safety = checkMutationSafety(r.mutation, { isFounder: founder, hasConfirmation: false });
        const blocked = safety.blockedReasons.length > 0;
        return (
          <div key={r.mutation.id} className="aether-card-elevated p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded
                    ${r.mutation.riskLevel === "HIGH" ? "bg-rose-500/20 text-rose-300" :
                      r.mutation.riskLevel === "MEDIUM" ? "bg-amber-500/20 text-amber-300" :
                      "bg-emerald-500/20 text-emerald-300"}`}>
                    {r.mutation.riskLevel}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{r.mutation.type}</span>
                </div>
                <p className="text-sm text-foreground/95">{r.userFacingText}</p>
                {founderView && <div className="text-[10px] text-muted-foreground mt-1">Founder · {r.founderText}</div>}
                {blocked && <div className="text-[11px] text-rose-300 mt-1">{safety.blockedReasons.join(" ")}</div>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setPreview(r.mutation)}>预览</Button>
                <Button size="sm" disabled={blocked} onClick={() => onApply(r.mutation)}>应用</Button>
                <Button size="sm" variant="ghost" onClick={() => onIgnore(r.mutation)}>忽略</Button>
              </div>
            </div>
          </div>
        );
      })}
      {preview && <EvolutionMutationPreview mutation={preview} onClose={() => setPreview(null)} onConfirm={(m) => { onApply(m); setPreview(null); }} />}
    </div>
  );
}
