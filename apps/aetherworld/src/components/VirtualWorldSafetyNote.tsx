import { WORLD_SAFETY_TEXT, FULL_WORLD_PRIVACY_HINT, DEMO_WORLD_HINT } from "@/constants/worldSafetyRules";
import { ShieldAlert } from "lucide-react";

export function VirtualWorldSafetyNote({ worldMode }: { worldMode?: string }) {
  const extra = worldMode === "FULL_PERSONAL_WORLD" ? FULL_WORLD_PRIVACY_HINT
    : worldMode === "DEMO_WORLD" ? DEMO_WORLD_HINT : null;
  return (
    <div className="aether-card p-4 border-l-2 border-amber-500/40">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber-500/90">
        <ShieldAlert className="w-3.5 h-3.5" /> 安全边界 · Safety Boundary
      </div>
      <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">{WORLD_SAFETY_TEXT}</p>
      {extra && <p className="text-xs text-amber-400/90 mt-2">{extra}</p>}
    </div>
  );
}
