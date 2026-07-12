import { useState } from "react";
import { runTextAudit } from "@/lib/text-dynamic/textAuditEngine";

export function TextAuditPanel() {
  const [result, setResult] = useState(() => runTextAudit());
  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-lg">文本审计 · Text Audit</h2>
        <div className="flex items-center gap-2">
          <span className={statusClass(result.status)}>{result.status}</span>
          <button onClick={() => setResult(runTextAudit())}
            className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground">重新审计</button>
        </div>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric label="总检查数" value={result.summary.totalChecked} />
        <Metric label="CRITICAL" value={result.summary.critical} />
        <Metric label="HIGH" value={result.summary.high} />
        <Metric label="WARN" value={result.summary.warn} />
      </div>
      <ul className="divide-y divide-border text-xs">
        {result.issues.map((i, idx) => (
          <li key={idx} className="py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono">{i.textId}</div>
              <span className={sevClass(i.severity)}>{i.severity}</span>
            </div>
            <div className="text-muted-foreground">{i.ruleId} · {i.message}</div>
          </li>
        ))}
        {result.issues.length === 0 && <li className="py-4 text-center text-muted-foreground">没有问题。</li>}
      </ul>
      <div className="text-xs text-muted-foreground">
        建议：{result.recommendedFixes.join("；")}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded border border-border bg-muted/30 px-3 py-2">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-xl font-display">{value}</div>
  </div>;
}
function statusClass(s: string) {
  const base = "text-xs px-2 py-0.5 rounded border";
  if (s === "FAIL") return `${base} border-red-500 text-red-500`;
  if (s === "WARN") return `${base} border-amber-500 text-amber-500`;
  return `${base} border-emerald-500 text-emerald-400`;
}
function sevClass(s: string) {
  const base = "text-[10px] px-2 py-0.5 rounded border";
  if (s === "CRITICAL") return `${base} border-red-500 text-red-500`;
  if (s === "HIGH") return `${base} border-orange-500 text-orange-400`;
  if (s === "WARN") return `${base} border-amber-500 text-amber-500`;
  return `${base} border-border text-muted-foreground`;
}
