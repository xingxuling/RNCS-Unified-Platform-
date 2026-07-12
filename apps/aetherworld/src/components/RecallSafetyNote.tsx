import { RECALL_SAFETY_TEXT, RECALL_SAFETY_RULES } from "@/constants/recallSafetyRules";
import { ShieldAlert } from "lucide-react";

export function RecallSafetyNote({ compact = false }: { compact?: boolean }) {
  return (
    <div className="aether-card p-4 border-l-2 border-amber-500/40">
      <div className="flex items-center gap-2 text-amber-400">
        <ShieldAlert className="w-4 h-4" />
        <div className="text-[10px] uppercase tracking-wider">Recall Safety · 潜意识记忆边界</div>
      </div>
      <p className="text-xs text-foreground/85 mt-2 leading-relaxed">{RECALL_SAFETY_TEXT}</p>
      {!compact && (
        <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
          {RECALL_SAFETY_RULES.map(r => (
            <li key={r.id}>· [{r.severity}] {r.description}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
