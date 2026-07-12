import type { WebLcmQaReport } from "@/lib/weblcm/webLcmQaBridge";

export function WebLcmQaPanel({ qa }: { qa: WebLcmQaReport | null }) {
  if (!qa) return <div className="text-xs text-muted-foreground p-3 rounded border border-border/40">尚无 QA 报告。</div>;
  const color = qa.status === "BLOCKED" ? "text-red-500" : qa.status === "WARN" ? "text-amber-500" : "text-emerald-500";
  return (
    <div className="space-y-2 text-xs">
      <div className={`rounded border border-border/40 p-3 ${color}`}>QA 状态：{qa.status} · 检查时间 {new Date(qa.checkedAt).toLocaleString()}</div>
      {qa.issues.length === 0 ? <div className="text-muted-foreground">无问题。</div> :
        <ul className="rounded border border-border/40 p-3 space-y-1">
          {qa.issues.map((i, idx) => <li key={idx}>• [{i.severity}] {i.ruleId} — {i.message}</li>)}
        </ul>
      }
    </div>
  );
}
