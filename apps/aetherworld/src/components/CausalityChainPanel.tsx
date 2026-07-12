import type { CausalityChain } from "@/lib/causalityChainEngine";

export function CausalityChainPanel({ chains }: { chains: CausalityChain[] }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Causality · 因果链</div>
      <div className="mt-3 space-y-3">
        {chains.map(c => (
          <div key={c.id} className="aether-card p-3">
            <div className="text-xs text-muted-foreground">置信度 {c.confidence}%</div>
            <div className="text-sm mt-1"><span className="text-primary">起因：</span>{c.cause}</div>
            <div className="text-[11px] text-muted-foreground mt-1">中间因子：{c.intermediateFactors.join(" → ")}</div>
            <div className="text-sm mt-1"><span className="text-emerald-400">结果：</span>{c.effect}</div>
            <p className="text-xs text-foreground/90 mt-2 leading-snug">{c.explanation}</p>
          </div>
        ))}
        {chains.length === 0 && <div className="text-xs text-muted-foreground">尚未生成因果链。</div>}
      </div>
    </div>
  );
}
