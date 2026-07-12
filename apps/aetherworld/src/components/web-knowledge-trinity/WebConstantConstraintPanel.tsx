import type { WebCoMRunResult } from "@/lib/web-knowledge-trinity/webcom/webCoMRuntime";
import { getConstant } from "@/lib/web-knowledge-trinity/webcom/webCoMConstantIndexer";

export function WebConstantConstraintPanel({ result }: { result?: WebCoMRunResult }) {
  if (!result) return <div className="text-xs text-muted-foreground">尚未生成常数约束包。</div>;
  return (
    <div className="space-y-2 text-xs">
      <div className="rounded border border-border/40 p-2">
        <div className="font-semibold mb-1">约束包 {result.bundle.bundleId.slice(-8)}</div>
        <div className="text-muted-foreground mb-1">taskType={result.bundle.taskType}</div>
        <div className="text-muted-foreground mb-1">{result.bundle.contextSummary}</div>
      </div>
      <div className="rounded border border-border/40 p-2">
        <div className="font-semibold mb-1">已注入常数</div>
        <div className="space-y-1.5">
          {result.bundle.appliedConstantIds.map((id) => {
            const c = getConstant(id);
            return (
              <div key={id} className="border-b border-border/20 pb-1">
                <span className="font-mono text-amber-400">[{c?.priority ?? "?"}]</span>{" "}
                <span className="font-medium">{c?.chineseName ?? id}</span>{" "}
                <span className="text-[10px] text-muted-foreground">{id}</span>
                {c && <div className="text-[10px] text-muted-foreground">{c.invariantRule}</div>}
              </div>
            );
          })}
        </div>
      </div>
      {result.violations.length > 0 && (
        <div className="rounded border border-red-500/30 bg-red-500/5 p-2">
          <div className="font-semibold text-red-300 mb-1">违背项</div>
          {result.violations.map((v, i) => (
            <div key={i}>• [{v.severity}] {v.reason}</div>
          ))}
        </div>
      )}
    </div>
  );
}
