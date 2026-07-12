import { summarizeCalculusIndex, listCalculusItems } from "@/lib/web-knowledge-trinity/webcm/webCmCalculusIndexer";
import type { WebCmRunResult } from "@/lib/web-knowledge-trinity/webcm/webCmRuntime";

export function WebCmPanel({ result }: { result?: WebCmRunResult }) {
  const summary = summarizeCalculusIndex();
  const all = listCalculusItems();
  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="计算法总数" value={summary.total} />
        <Stat label="按风险" value={Object.entries(summary.byRisk).map(([k, v]) => `${k}:${v}`).join(" ")} />
      </div>
      {result && (
        <div className="rounded border border-border/40 p-2 space-y-1.5">
          <div className="font-semibold">本次路线 <span className="text-[10px] text-muted-foreground">{result.route.routeId.slice(-8)}</span></div>
          <div className="text-muted-foreground">{result.route.routeReason}</div>
          <div className="space-y-1">
            {result.route.executionSteps.map((s, i) => (
              <div key={s.stepId} className="rounded border border-border/30 p-1.5">
                <span className="text-muted-foreground">步骤 {i + 1}: </span>
                <span className="font-medium">{s.action}</span>
                <span className="text-[10px] ml-1 text-amber-400">{s.calculusId}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground">
            预计 {result.plan.estimatedMillis}ms · QA={result.qa.status} · 必需 QA={result.route.qaRequired ? "是" : "否"}
          </div>
        </div>
      )}
      <details className="rounded border border-border/40 p-2">
        <summary className="cursor-pointer font-semibold">全部计算法 ({all.length})</summary>
        <div className="mt-2 grid grid-cols-1 gap-1 max-h-60 overflow-y-auto">
          {all.map((c) => (
            <div key={c.calculusId} className="text-[11px]">
              <span className="font-mono text-amber-400">[{c.riskLevel}]</span> {c.chineseName} <span className="text-muted-foreground">({c.calculusId})</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-border/40 p-2">
      <div className="text-muted-foreground text-[10px]">{label}</div>
      <div className="font-mono">{value}</div>
    </div>
  );
}
