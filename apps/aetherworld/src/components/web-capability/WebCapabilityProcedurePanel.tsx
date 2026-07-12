import type { ProcedureStepRun } from "@/lib/web-capability/webCapabilityProcedureEngine";

export function WebCapabilityProcedurePanel({ steps }: { steps: ProcedureStepRun[] }) {
  return (
    <section className="rounded-lg border bg-card p-4 space-y-2">
      <h3 className="text-sm font-semibold">能力流程 · Capability Procedure</h3>
      <ol className="space-y-1.5 text-xs">
        {steps.map((s, i) => (
          <li key={s.stepId} className="flex items-start gap-2">
            <span className="text-muted-foreground w-6 shrink-0">{i + 1}.</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{s.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  s.status === "DONE" ? "bg-emerald-500/10 text-emerald-600" :
                  s.status === "BLOCKED" ? "bg-rose-500/10 text-rose-600" : "bg-muted text-muted-foreground"
                }`}>{s.status}</span>
              </div>
              <div className="text-muted-foreground">{s.note}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
