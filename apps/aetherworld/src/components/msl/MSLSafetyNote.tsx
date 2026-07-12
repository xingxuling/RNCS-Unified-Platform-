import { Card } from "@/components/ui/card";
import { MSL_BOUNDARY_NOTE } from "@/lib/msl/mslSafetyGuard";
import { MSL_SAFETY_RULES } from "@/constants/msl/mslSafetyRules";

export function MSLSafetyNote({ extraNotes }: { extraNotes?: string[] }) {
  return (
    <Card className="p-4 space-y-2 border-amber-500/40 bg-amber-500/5">
      <div className="text-sm font-medium text-amber-500">安全边界 · Safety</div>
      <div className="text-xs text-muted-foreground">{MSL_BOUNDARY_NOTE}</div>
      <ul className="text-xs space-y-1 list-disc pl-4">
        {MSL_SAFETY_RULES.map(r => (
          <li key={r.id}>
            <span className="text-muted-foreground">[{r.severity}]</span> {r.recommended}
          </li>
        ))}
      </ul>
      {extraNotes && extraNotes.length > 0 && (
        <div className="text-xs text-amber-500 space-y-0.5">
          {extraNotes.map((n, i) => <div key={i}>{n}</div>)}
        </div>
      )}
    </Card>
  );
}
