import type { ImpactBreakdown } from "@/lib/version-leap/versionImpactAnalyzer";
import { getScope } from "@/constants/version-leap/versionImpactScopes";

export function VersionImpactCard({ breakdown }: { breakdown: ImpactBreakdown[] }) {
  if (!breakdown.length) {
    return <p className="text-sm text-muted-foreground">暂无影响范围数据。</p>;
  }
  return (
    <div className="space-y-2">
      {breakdown.map((b) => {
        const sc = getScope(b.scopeId);
        return (
          <div key={b.scopeId} className="border border-border/40 rounded-md p-3 bg-muted/10">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{sc?.name ?? b.scopeId}</span>
              <span className="text-xs text-muted-foreground">权重 {b.weight.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{sc?.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {b.reasons.map((r, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{r}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
