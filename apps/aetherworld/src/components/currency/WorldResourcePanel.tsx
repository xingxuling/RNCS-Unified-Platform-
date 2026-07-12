import { WORLD_RESOURCES } from "@/constants/currency/worldResourceTypes";
import type { ResourceBalance } from "@/lib/currency/worldResourceEngine";

interface Props {
  balance: ResourceBalance;
}

export function WorldResourcePanel({ balance }: Props) {
  return (
    <div className="border rounded-md p-4 space-y-3 bg-card">
      <div>
        <h3 className="text-sm font-medium">世界资源 · World Resources</h3>
        <p className="text-[11px] text-muted-foreground">仅用于虚拟世界与虚拟生活，不代表现实资产。</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {WORLD_RESOURCES.map((r) => (
          <div key={r.id} className="border border-border/60 rounded p-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{r.name}</span>
              <span className="text-amber-400 font-semibold">{(balance[r.id] ?? 0).toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">数字 {r.relatedDigit} · {r.relatedDomain}</div>
            <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{r.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
