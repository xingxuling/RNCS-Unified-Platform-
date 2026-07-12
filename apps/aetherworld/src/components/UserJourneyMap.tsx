import { ArrowRight } from "lucide-react";

export function UserJourneyMap({ steps }: { steps: string[] }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">User Journey Map</div>
      <div className="font-display text-lg gold-text mt-1">推荐用户路径</div>

      <div className="gold-divider my-3" />

      <ol className="space-y-2.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full border border-primary/40 bg-primary/5 inline-flex items-center justify-center font-mono text-[11px] text-primary">
              {i + 1}
            </div>
            <div className="text-sm text-foreground/90 pt-1">{s}</div>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>onboarding</span><ArrowRight className="w-3 h-3" /><span>activation</span><ArrowRight className="w-3 h-3" /><span>feedback</span>
      </div>
    </div>
  );
}
