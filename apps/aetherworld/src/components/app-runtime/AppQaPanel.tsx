import type { AppQaResult } from "@/lib/app-runtime/appProjectObjectEngine";

export function AppQaPanel({ qa }: { qa?: AppQaResult }) {
  if (!qa) return <div className="text-sm text-muted-foreground">未运行 QA</div>;
  const tone = qa.status === "BLOCKED" || qa.status === "FAIL" ? "text-red-400" : qa.status === "WARN" ? "text-amber-300" : "text-emerald-300";
  return (
    <div className="border border-border/40 rounded p-3 space-y-2 text-sm">
      <div className="flex justify-between items-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">QA Report</div>
        <span className={`text-[11px] font-mono ${tone}`}>{qa.status}</span>
      </div>
      {qa.issues.length === 0 ? (
        <div className="text-[12px] text-muted-foreground">未发现问题。</div>
      ) : (
        <ul className="space-y-1 text-[11px]">
          {qa.issues.map((i, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="font-mono text-muted-foreground w-16">{i.severity}</span>
              <span className="font-mono text-muted-foreground w-16">{i.ruleId}</span>
              <span>{i.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
