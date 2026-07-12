import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RegisteredWorld, WorldPortal } from "@/lib/sequence-world/multiverse/types";

export function WorldPortalPanel({ portals, worlds }: { portals: WorldPortal[]; worlds: RegisteredWorld[] }) {
  const name = (id: string) => worlds.find((w) => w.worldId === id)?.worldName ?? id;
  if (!portals.length) {
    return <Card className="p-4 text-xs text-muted-foreground">尚未创建任何门户。</Card>;
  }
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">世界门户 · Portals</h3>
      <ul className="space-y-2">
        {portals.map((p) => (
          <li key={p.portalId} className="rounded-md border border-border/50 p-2 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono">{name(p.fromWorldId)} → {name(p.toWorldId)}</span>
              <Badge variant="outline" className="text-[10px]">{p.portalType}</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground">权限：{p.requiredPermission} · 稳定度：{p.stability.toFixed(2)} · 可转移：{p.transferAllowed ? "是" : "否"}</div>
            {p.safetyNotes.length > 0 && (
              <div className="text-[10px] text-amber-400 mt-1">⚠ {p.safetyNotes[0]}</div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
