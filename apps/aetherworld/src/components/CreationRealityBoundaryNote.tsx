import { CREATION_REALITY_BOUNDARY_TEXT } from "@/constants/creationRiskTypes";
import { ShieldAlert } from "lucide-react";

export function CreationRealityBoundaryNote() {
  return (
    <div className="aether-card p-4 border-l-2 border-amber-500/40">
      <div className="flex items-center gap-2 text-amber-400">
        <ShieldAlert className="w-4 h-4" />
        <div className="text-[10px] uppercase tracking-wider">Reality Boundary · 现实科学边界</div>
      </div>
      <p className="text-xs text-foreground/85 mt-2 leading-relaxed">{CREATION_REALITY_BOUNDARY_TEXT}</p>
    </div>
  );
}
