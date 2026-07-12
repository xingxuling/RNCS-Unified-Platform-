import type { BreakthroughSafetyFinding } from "@/lib/breakthroughSafetyGuard";
import { SAFETY_DISCLAIMERS } from "@/lib/breakthroughSafetyGuard";

export function BreakthroughSafetyNote({ findings, beginner }: { findings: BreakthroughSafetyFinding[]; beginner: boolean }) {
  return (
    <section className="border border-amber-500/40 bg-amber-500/5 rounded-md p-4 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-amber-500">Safety Boundary · 安全边界</div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {beginner ? SAFETY_DISCLAIMERS.short : SAFETY_DISCLAIMERS.full}
      </p>
      {findings.length > 0 && (
        <ul className="text-[11px] space-y-1">
          {findings.map((f, i) => (
            <li key={i} className={`${
              f.severity === "CRITICAL" ? "text-destructive" :
              f.severity === "HIGH" ? "text-amber-500" : "text-muted-foreground"
            }`}>
              [{f.severity}] {f.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
