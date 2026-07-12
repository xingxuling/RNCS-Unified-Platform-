import type { WebCapabilityQaResult } from "@/lib/web-capability/aetherWebCapabilityModels";

export function WebCapabilityQaPanel({ qa }: { qa: WebCapabilityQaResult }) {
  const color = qa.status === "PASS" ? "text-emerald-600" : qa.status === "WARN" ? "text-amber-600" : "text-rose-600";
  return (
    <section className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">QA 结果</h3>
        <span className={`text-xs font-mono ${color}`}>{qa.status}</span>
      </div>
      {qa.warnings.length === 0 ? (
        <div className="text-xs text-muted-foreground">无警告。</div>
      ) : (
        <ul className="text-xs space-y-1">
          {qa.warnings.map((w, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-mono text-muted-foreground">{w.ruleId}</span>
              <span>{w.message}</span>
              <span className="text-[10px] text-muted-foreground">({w.severity})</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
