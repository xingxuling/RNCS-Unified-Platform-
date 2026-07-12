import { ShieldAlert } from "lucide-react";
import { PRESENTATION_SAFETY_RULES } from "@/constants/sequence-world/presentation/presentationSafetyRules";

export function PresentationSafetyNote() {
  return (
    <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm space-y-2">
      <div className="flex items-center gap-2 font-medium">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        World Presentation Runtime v0.6 · 安全边界
      </div>
      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
        {PRESENTATION_SAFETY_RULES.map(r => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
}
