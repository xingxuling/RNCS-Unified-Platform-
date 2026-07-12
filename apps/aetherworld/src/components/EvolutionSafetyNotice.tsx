import { EVOLUTION_SAFETY_RULES, EVOLUTION_BOUNDARY_TEXT } from "@/constants/evolutionSafetyRules";
import { ShieldAlert } from "lucide-react";

export function EvolutionSafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className="aether-card p-4 border-l-2 border-amber-500/40">
      <div className="flex items-center gap-2 text-amber-400">
        <ShieldAlert className="w-4 h-4" />
        <div className="text-[10px] uppercase tracking-wider">Evolution Safety · 本地进化边界</div>
      </div>
      <p className="text-xs text-foreground/85 mt-2 leading-relaxed">{EVOLUTION_BOUNDARY_TEXT}</p>
      {!compact && (
        <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
          {EVOLUTION_SAFETY_RULES.map(r => (
            <li key={r.id}>· [{r.severity}] {r.description}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
