import { WORLD_GROWTH_SAFETY_NOTE, WORLD_GROWTH_FORBIDDEN } from "@/constants/sequence-world/growth/worldGrowthSafetyRules";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export function WorldGrowthSafetyNote({ notes }: { notes?: string[] }) {
  return (
    <Card className="p-4 border-amber-500/40 bg-amber-500/5">
      <div className="flex items-start gap-2">
        <ShieldAlert className="size-4 mt-0.5 text-amber-500 shrink-0" />
        <div className="space-y-2 text-xs leading-relaxed">
          <p className="text-foreground/90">{WORLD_GROWTH_SAFETY_NOTE}</p>
          {notes && notes.length > 0 && (
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              {notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
          <details className="text-muted-foreground">
            <summary className="cursor-pointer">禁止事项</summary>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {WORLD_GROWTH_FORBIDDEN.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </details>
        </div>
      </div>
    </Card>
  );
}
