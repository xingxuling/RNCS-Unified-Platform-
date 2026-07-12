import type { CodeErrorSummary } from "@/lib/code-sandbox/codeRunRequestEngine";
import { CODE_ERROR_TYPE_LABELS } from "@/constants/code-sandbox/codeErrorTypes";

export function CodeErrorSummaryPanel({ error }: { error?: CodeErrorSummary }) {
  if (!error) {
    return <div className="border border-border/40 rounded p-3 text-[12px] text-muted-foreground">未检测到错误。</div>;
  }
  return (
    <div className="border border-red-700/40 bg-red-950/10 rounded p-3 space-y-1 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-red-300">Error Summary · {error.severity}</div>
      <div className="font-medium">{error.title}</div>
      <div className="text-[11px] text-muted-foreground">类型：{CODE_ERROR_TYPE_LABELS[error.errorType] || error.errorType}</div>
      <pre className="text-[11px] whitespace-pre-wrap text-muted-foreground">{error.explanation}</pre>
      {error.affectedFiles.length > 0 && (
        <div className="text-[11px] text-muted-foreground">影响文件：{error.affectedFiles.join("、")}</div>
      )}
      {error.suspectedCauses.length > 0 && (
        <div className="text-[11px] text-muted-foreground">疑似原因：{error.suspectedCauses.join("、")}</div>
      )}
    </div>
  );
}
