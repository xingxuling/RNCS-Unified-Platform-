import type { CompressionAuditResult } from "@/lib/compression/compressionAuditEngine";

export function CompressionAuditPanel({ result }: { result: CompressionAuditResult }) {
  const tone =
    result.status === "FAIL" ? "border-red-500/40 bg-red-500/5 text-red-600" :
    result.status === "WARN" ? "border-amber-500/40 bg-amber-500/5 text-amber-600" :
    "border-emerald-500/40 bg-emerald-500/5 text-emerald-600";
  return (
    <section className="rounded-md border border-border/60 p-3 space-y-2">
      <header className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">压缩审计</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded border ${tone}`}>{result.status}</span>
      </header>
      {result.issues.length === 0 ? (
        <div className="text-xs text-muted-foreground">未发现问题。</div>
      ) : (
        <ul className="text-xs space-y-1.5">
          {result.issues.map((i, idx) => (
            <li key={idx} className="border-b border-border/40 pb-1 last:border-0">
              <div className="flex items-center justify-between">
                <span className="font-medium">{i.label}</span>
                <span className="text-[10px] text-muted-foreground">{i.severity}</span>
              </div>
              <div className="text-muted-foreground">{i.detail}</div>
            </li>
          ))}
        </ul>
      )}
      {result.suggestedFixes.length > 0 && (
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">建议修复</h4>
          <ul className="text-xs list-disc list-inside space-y-0.5">
            {result.suggestedFixes.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
