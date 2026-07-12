import type { CausalChainNode } from "@/lib/sequence-world/simulation/causalChainEngine";

export function CausalChainGraph({ chain }: { chain: CausalChainNode[] }) {
  const recent = chain.slice(-15).reverse();
  return (
    <div className="aether-card p-4">
      <h3 className="font-display gold-text mb-2">因果链（最近 15）</h3>
      {recent.length === 0 ? <p className="text-xs text-muted-foreground">尚无因果节点</p> : (
        <ol className="space-y-2 text-xs">
          {recent.map(n => (
            <li key={n.id} className="aether-card p-2">
              <div className="text-muted-foreground">Tick {n.tick} · {n.causeType}</div>
              <div className="text-foreground">{n.causeSummary} <span className="text-primary">→</span> {n.effectSummary}</div>
              <div className="text-muted-foreground mt-1">强度 {n.strength.toFixed(2)} · 影响 NPC: {n.affectedNpcs.join(",") || "—"}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
