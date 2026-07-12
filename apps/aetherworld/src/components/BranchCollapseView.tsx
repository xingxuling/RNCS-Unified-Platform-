import type { BranchResult } from "@/lib/branchCollapse";
import { COLLAPSE_LAYERS, BRANCH_STATE_LABEL } from "@/constants/collapseFactors";

const STATE_COLOR: Record<BranchResult["state"], string> = {
  OPEN: "var(--muted-foreground)",
  NARROW: "var(--trigger-mid)",
  COMPETING: "var(--trigger-high)",
  COLLAPSING: "var(--trigger-peak)",
  MANIFESTED: "var(--gold)",
  CLOSED: "var(--destructive)",
};

export function BranchCollapseView({ branches }: { branches: BranchResult[] }) {
  return (
    <div className="space-y-3">
      {branches.map((b) => (
        <div key={b.id} className="aether-card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Branch</div>
              <div className="font-display text-lg gold-text mt-1">{b.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{b.likelyEvent}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl" style={{ color: STATE_COLOR[b.state] }}>{b.total}</div>
              <div className="text-[10px] tracking-wider" style={{ color: STATE_COLOR[b.state] }}>{BRANCH_STATE_LABEL[b.state]}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
            {COLLAPSE_LAYERS.map((l) => {
              const v = b.scores[l.key] ?? 0;
              return (
                <div key={l.key} className="rounded-md bg-muted/20 p-2">
                  <div className="text-[9px] text-muted-foreground tracking-wider">{l.name}</div>
                  <div className="font-mono text-sm mt-0.5">{v}</div>
                  <div className="mt-1 h-1 rounded-full bg-muted/40 overflow-hidden">
                    <div className="h-full" style={{ width: `${v}%`, background: STATE_COLOR[b.state] }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="text-primary/80">最强：</span>{COLLAPSE_LAYERS.find(l=>l.key===b.strongest)?.name}
            <span className="mx-2">·</span>
            <span className="text-destructive/80">最弱：</span>{COLLAPSE_LAYERS.find(l=>l.key===b.weakest)?.name}
          </div>
          {b.blockers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {b.blockers.map((x) => (
                <span key={x} className="text-[10px] px-1.5 py-0.5 rounded border border-destructive/40 text-destructive">阻断 · {x}</span>
              ))}
            </div>
          )}
          <div className="mt-3 text-sm">{b.actionImpact}</div>
        </div>
      ))}
    </div>
  );
}
