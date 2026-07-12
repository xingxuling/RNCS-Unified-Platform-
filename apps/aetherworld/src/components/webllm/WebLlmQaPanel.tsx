import type { WebLlmQaResult } from "@/lib/webllm/webLlmQaBridge";

export function WebLlmQaPanel({ qa }: { qa: WebLlmQaResult | null }) {
  if (!qa) return <div className="border border-border/40 rounded p-3 text-sm text-muted-foreground">尚无 QA 结果。</div>;
  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">WebLLM QA</div>
      <div className="text-sm">状态：<span className="font-mono">{qa.status}</span></div>
      <ul className="text-[11px] space-y-1">
        {qa.issues.length === 0 && <li className="text-muted-foreground">未发现问题。</li>}
        {qa.issues.map((i, idx) => (
          <li key={idx} className="border border-border/30 rounded px-2 py-1">
            <span className="font-mono mr-2">[{i.severity}]</span>{i.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
