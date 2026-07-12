import type { AppRuntimeTraceEntry } from "@/lib/app-runtime/appRuntimeTraceEngine";

export function AppRuntimeTracePanel({ trace }: { trace: AppRuntimeTraceEntry[] }) {
  return (
    <div className="border border-border/40 rounded p-3 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Runtime Trace</div>
      <ol className="space-y-1 text-[11px]">
        {trace.map((t, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted-foreground font-mono w-6">{i + 1}.</span>
            <span className="text-muted-foreground font-mono w-24">{t.step}</span>
            <span>{t.description}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
