import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RegisteredWorld } from "@/lib/sequence-world/multiverse/types";
import { WorldIdentityCard } from "./WorldIdentityCard";

export function WorldRegistryPanel({ worlds }: { worlds: RegisteredWorld[] }) {
  if (!worlds.length) {
    return (
      <Card className="p-4 text-xs text-muted-foreground">尚未注册任何世界。可点击「重新运行」生成 Demo 世界。</Card>
    );
  }
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">世界注册表 · World Registry</h3>
        <Badge variant="outline" className="text-[10px]">{worlds.length} worlds</Badge>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {worlds.map((w) => (
          <WorldIdentityCard key={w.worldId} world={w} />
        ))}
      </div>
    </Card>
  );
}
