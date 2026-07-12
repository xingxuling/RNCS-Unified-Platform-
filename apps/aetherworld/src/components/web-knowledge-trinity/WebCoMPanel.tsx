import { listConstants, summarizeConstantIndex } from "@/lib/web-knowledge-trinity/webcom/webCoMConstantIndexer";
import type { WebCoMRunResult } from "@/lib/web-knowledge-trinity/webcom/webCoMRuntime";

export function WebCoMPanel({ result }: { result?: WebCoMRunResult }) {
  const summary = summarizeConstantIndex();
  const all = listConstants();
  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="常数总数" value={summary.total} />
        <Stat label="按类型" value={Object.keys(summary.byType).length + " 类"} />
      </div>
      {result && (
        <div className="rounded border border-border/40 p-2 space-y-1.5">
          <div className="font-semibold">本次约束包 <span className="text-[10px] text-muted-foreground">{result.bundle.bundleId.slice(-8)}</span></div>
          <div className="text-muted-foreground">taskType={result.bundle.taskType} · 已注入 {result.bundle.appliedConstantIds.length} 条</div>
          <div className="flex flex-wrap gap-1">
            {result.bundle.appliedConstantIds.map((id) => (
              <span key={id} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-mono">{id}</span>
            ))}
          </div>
          {result.violations.length > 0 && (
            <div className="mt-2 rounded border border-red-500/30 bg-red-500/5 p-2">
              <div className="font-semibold text-red-300 mb-1">违背 ({result.violations.length})</div>
              {result.violations.map((v, i) => (
                <div key={i} className="text-[10px]">• [{v.severity}] {v.reason}</div>
              ))}
            </div>
          )}
        </div>
      )}
      <details className="rounded border border-border/40 p-2">
        <summary className="cursor-pointer font-semibold">全部常数 ({all.length})</summary>
        <div className="mt-2 grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto">
          {all.map((c) => (
            <div key={c.constantId} className="text-[11px] border-b border-border/20 pb-1">
              <div><span className="font-mono text-amber-400">[{c.priority}]</span> <span className="font-medium">{c.chineseName}</span> ({c.constantId})</div>
              <div className="text-muted-foreground">{c.definition}</div>
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
