import { Card } from "@/components/ui/card";
import type { CrossWorldRelation, RegisteredWorld } from "@/lib/sequence-world/multiverse/types";

export function CrossWorldRelationGraph({ relations, worlds }: { relations: CrossWorldRelation[]; worlds: RegisteredWorld[] }) {
  const name = (id: string) => worlds.find((w) => w.worldId === id)?.worldName ?? id;
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">跨世界关系 · Cross-World Relations</h3>
      {relations.length === 0 ? (
        <div className="text-xs text-muted-foreground">暂无跨世界关系。</div>
      ) : (
        <ul className="space-y-2 text-xs">
          {relations.map((r) => (
            <li key={r.relationId} className="rounded-md border border-border/50 p-2">
              <div className="font-mono">{name(r.worldA)} ↔ {name(r.worldB)} · {r.relationType}</div>
              <div className="text-[11px] text-muted-foreground">信任 {r.trust.toFixed(2)} · 冲突 {r.conflict.toFixed(2)} · 资源流 {r.resourceFlow.toFixed(2)}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
