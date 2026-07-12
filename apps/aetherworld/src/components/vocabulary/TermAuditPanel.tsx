import { VOCABULARY_REGISTRY } from "@/lib/vocabulary/vocabularyRegistry";
import { runTermAudit } from "@/lib/vocabulary/termAuditEngine";

export function TermAuditPanel() {
  const issues = runTermAudit(VOCABULARY_REGISTRY);
  const critical = issues.filter((i) => i.severity === "CRITICAL").length;
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-display">词汇审计</h3>
        <span className="text-xs text-muted-foreground">问题 {issues.length} · CRITICAL {critical}</span>
      </div>
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">当前没有词汇误用问题。</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {issues.map((i) => (
            <li key={i.issueId} className="rounded border border-border/40 p-2">
              <div className="flex items-baseline gap-2">
                <span className={`px-1.5 py-0.5 rounded ${i.severity === "CRITICAL" ? "bg-red-500/15 text-red-400" : i.severity === "HIGH" ? "bg-amber-500/15 text-amber-400" : "bg-muted/40"}`}>{i.severity}</span>
                <span className="font-mono">{i.termId}</span>
                <span className="text-muted-foreground">{i.misuseType}</span>
              </div>
              <div className="mt-1">{i.explanation}</div>
              <div className="mt-1 text-muted-foreground">建议：{i.suggestedFix}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
