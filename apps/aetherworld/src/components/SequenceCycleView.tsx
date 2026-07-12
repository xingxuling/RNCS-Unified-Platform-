import { Badge } from "@/components/ui/badge";
import type { CycleAnalysis } from "@/lib/realSubjectCalculus";
import { FIVE_DOMAIN_META, FIVE_DOMAIN_KEYS, type FiveDomainKey } from "@/constants/subjectSequenceModes";

interface Props {
  cycle: CycleAnalysis;
}

export function SequenceCycleView({ cycle }: Props) {
  const maxAvg = Math.max(...FIVE_DOMAIN_KEYS.map((k) => cycle.domainAverages[k])) || 1;
  return (
    <div className="aether-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{cycle.en}</div>
          <div className="font-display text-lg gold-text">{cycle.cn}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">第 {cycle.range[0]}–{cycle.range[1]} 组</div>
        </div>
        <Badge variant="outline" className="border-border text-xs">
          终端高频 {cycle.dominantTerminal}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{cycle.interpretation}</p>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">五域均值</div>
        <div className="space-y-1.5">
          {FIVE_DOMAIN_KEYS.map((k: FiveDomainKey) => {
            const v = cycle.domainAverages[k];
            const pct = (v / maxAvg) * 100;
            const m = FIVE_DOMAIN_META[k];
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="w-8 text-xs" style={{ color: m.colorVar }}>{m.cn}</span>
                <div className="flex-1 h-1.5 bg-secondary/40 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: m.colorVar }} />
                </div>
                <span className="w-10 text-right font-mono text-[11px] text-muted-foreground">{v.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Field label="最强域" value={FIVE_DOMAIN_META[cycle.strongestDomain].cn} />
        <Field label="最弱域" value={FIVE_DOMAIN_META[cycle.weakestDomain].cn} />
        <Field label="最稳定" value={FIVE_DOMAIN_META[cycle.mostStableDomain].cn} />
        <Field label="最波动" value={FIVE_DOMAIN_META[cycle.mostVolatileDomain].cn} />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">高频数字</div>
        <div className="flex gap-2">
          {cycle.topDigits.map(({ d, c }) => (
            <div key={d} className="rounded-md border border-border bg-secondary/30 px-3 py-1.5 text-center">
              <div className="font-display text-base gold-text">{d}</div>
              <div className="text-[10px] text-muted-foreground">×{c}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-base mt-0.5">{value}</div>
    </div>
  );
}
