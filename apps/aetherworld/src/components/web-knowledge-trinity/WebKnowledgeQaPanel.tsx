import type { WebKnowledgeQaReport } from "@/lib/web-knowledge-trinity/webKnowledgeTrinityTypes";

export function WebKnowledgeQaPanel({ qa }: { qa?: WebKnowledgeQaReport }) {
  if (!qa) return <div className="text-xs text-muted-foreground">尚未生成 QA 报告。</div>;
  const color = qa.status === "PASS" ? "text-emerald-400"
    : qa.status === "WARN" ? "text-amber-400"
    : "text-red-400";
  return (
    <div className="space-y-2 text-xs">
      <div className={`font-semibold ${color}`}>QA 状态：{qa.status}</div>
      {qa.issues.length === 0 && <div className="text-muted-foreground">未发现问题。</div>}
      <div className="space-y-1">
        {qa.issues.map((i, idx) => (
          <div key={idx} className="rounded border border-border/30 p-2">
            <div className="font-mono text-[10px] text-amber-400">[{i.severity}] {i.ruleId}</div>
            <div>{i.message}</div>
          </div>
        ))}
      </div>
      {qa.recommendedFixes.length > 0 && (
        <details>
          <summary className="text-[10px] text-muted-foreground cursor-pointer">建议修复</summary>
          <ul className="text-[10px] list-disc list-inside mt-1">
            {qa.recommendedFixes.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
