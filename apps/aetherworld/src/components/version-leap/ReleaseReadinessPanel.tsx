import type { ReleaseReadinessResult } from "@/lib/version-leap/releaseReadinessChecker";

const STATUS_COLOR: Record<string, string> = {
  READY: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  WARN: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  BLOCKED: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

export function ReleaseReadinessPanel({ readiness }: { readiness: ReleaseReadinessResult }) {
  return (
    <div className="border border-border/40 rounded-md p-4 bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_COLOR[readiness.status]}`}>
          {readiness.status}
        </span>
        <span className="text-xs text-muted-foreground">
          通过 {readiness.passedCount}/{readiness.totalCount} · 建议版本 <span className="font-mono">{readiness.recommendedVersion}</span>
        </span>
      </div>
      {readiness.blockers.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1 text-rose-600">阻断与警告</p>
          <ul className="text-xs space-y-1">
            {readiness.blockers.map((b) => (
              <li key={b.ruleId} className="flex items-start gap-2">
                <span className="px-1.5 rounded text-[10px] bg-muted">{b.severity}</span>
                <span>{b.label}：<span className="text-muted-foreground">{b.hint}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {readiness.warnings.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1 text-amber-600">提示</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
            {readiness.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
