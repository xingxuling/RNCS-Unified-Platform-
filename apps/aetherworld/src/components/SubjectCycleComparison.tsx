import type { CycleDiff } from "@/lib/realSubjectCalculus";
import { FIVE_DOMAIN_META } from "@/constants/subjectSequenceModes";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  diffs: { c1_c2: CycleDiff; c2_c3: CycleDiff; c1_c3: CycleDiff };
}

export function SubjectCycleComparison({ diffs }: Props) {
  const items: Array<{ title: string; diff: CycleDiff }> = [
    { title: "Cycle 1 → Cycle 2", diff: diffs.c1_c2 },
    { title: "Cycle 2 → Cycle 3", diff: diffs.c2_c3 },
    { title: "Cycle 1 → Cycle 3（底盘 vs 终局）", diff: diffs.c1_c3 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {items.map(({ title, diff }) => (
        <div key={title} className="aether-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-display">
            <span>{diff.fromCycle}</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{diff.toCycle}</span>
          </div>
          <div className="text-xs text-muted-foreground">{title}</div>

          <div className="space-y-1.5">
            {diff.strongerDomains.map((k) => (
              <div key={`s-${k}`} className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span style={{ color: FIVE_DOMAIN_META[k].colorVar }}>{FIVE_DOMAIN_META[k].cn}</span>
                <span className="text-muted-foreground">域增强</span>
                <span className="ml-auto font-mono text-[10px] text-emerald-400">
                  +{diff.domainDelta[k].toFixed(2)}
                </span>
              </div>
            ))}
            {diff.weakerDomains.map((k) => (
              <div key={`w-${k}`} className="flex items-center gap-2 text-xs">
                <TrendingDown className="w-3 h-3 text-destructive" />
                <span style={{ color: FIVE_DOMAIN_META[k].colorVar }}>{FIVE_DOMAIN_META[k].cn}</span>
                <span className="text-muted-foreground">域减弱</span>
                <span className="ml-auto font-mono text-[10px] text-destructive">
                  {diff.domainDelta[k].toFixed(2)}
                </span>
              </div>
            ))}
            {diff.strongerDomains.length === 0 && diff.weakerDomains.length === 0 && (
              <div className="text-[11px] text-muted-foreground italic">五域无显著变化（≥0.6 阈值）。</div>
            )}
          </div>

          <div className="pt-2 border-t border-border/50 space-y-1">
            {diff.notes.map((n, i) => (
              <div key={i} className="text-[11px] text-muted-foreground leading-relaxed">· {n}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
