import type { WorldRule } from "@/lib/worldRuleGenerator";
import { Link } from "@tanstack/react-router";

export function WorldRuleMap({ rules }: { rules: WorldRule[] }) {
  return (
    <div>
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">World Rules · 世界法则</div>
        <h2 className="font-display text-xl">这个世界的法则</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rules.map(r => (
          <div key={r.ruleId} className="aether-card p-4">
            <div className="flex items-center justify-between">
              <div className="font-display text-base">{r.ruleName}</div>
              {r.encyclopediaRef && (
                <Link to="/encyclopedia-entry" search={{ id: r.encyclopediaRef } as never}
                      className="text-[11px] text-primary hover:underline">查看百科 →</Link>
              )}
            </div>
            <p className="text-sm text-foreground/90 mt-2 leading-relaxed">{r.userFriendlyExplanation}</p>
            <div className="mt-3 text-[11px] text-muted-foreground">
              <span className="text-primary/80">建议：</span>{r.actionAdvice}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground/70 font-mono">{r.technicalBasis}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
