import { ShieldAlert } from "lucide-react";
import { RECOMMENDED_DISCLAIMERS } from "@/lib/sequence-world/sequenceWorldSafetyGuard";

export function SequenceWorldSafetyNote() {
  return (
    <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm space-y-2">
      <div className="flex items-center gap-2 font-medium">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        Sequence World Engine v0.1 · 安全边界
      </div>
      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
        {RECOMMENDED_DISCLAIMERS.map(d => <li key={d}>{d}</li>)}
      </ul>
    </div>
  );
}
