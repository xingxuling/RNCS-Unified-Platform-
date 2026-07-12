import { createFileRoute } from "@tanstack/react-router";
import { SEQUENCE_OBJECT_SAFETY_RULES } from "@/constants/sequence-object/sequenceObjectSafetyRules";
import { SequenceObjectSafetyNote } from "@/components/sequence-object/SequenceObjectSafetyNote";

export const Route = createFileRoute("/sequence-object-audit")({
  head: () => ({ meta: [{ title: "对象审计 · Sequence Object Audit" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">对象审计 · Sequence Object Audit</h1>
      <p className="text-sm text-muted-foreground">列出所有安全规则与意义漂移检测项。</p>
      <div className="space-y-2">
        {SEQUENCE_OBJECT_SAFETY_RULES.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-card/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.id} · {r.title}</span>
              <span className={`text-xs ${r.severity === "CRITICAL" ? "text-red-400" : r.severity === "HIGH" ? "text-orange-400" : "text-amber-300"}`}>{r.severity}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
          </div>
        ))}
      </div>
      <SequenceObjectSafetyNote />
    </div>
  );
}
