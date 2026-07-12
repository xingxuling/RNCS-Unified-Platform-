import { Card } from "@/components/ui/card";
import type { RegisteredWorld, WorldPortal, WorldTravelState } from "@/lib/sequence-world/multiverse/types";

interface Props {
  worlds: RegisteredWorld[];
  portals: WorldPortal[];
  state?: WorldTravelState;
}

export function WorldTravelPanel({ worlds, portals, state }: Props) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">世界互访 · World Travel</h3>
      {!state ? (
        <div className="text-xs text-muted-foreground">尚未进入任何世界。可选择门户旅行至目标世界（虚拟事件，不代表现实行动）。</div>
      ) : (
        <div className="text-xs space-y-1">
          <div>当前世界：<span className="font-mono">{worlds.find((w) => w.worldId === state.currentWorldId)?.worldName ?? state.currentWorldId}</span></div>
          <div>已访问：{state.visitedWorldIds.length} 个</div>
          <div className="text-[11px] text-muted-foreground">{state.travelRisks.join("；")}</div>
        </div>
      )}
      <div className="text-[10px] text-muted-foreground mt-3">可用门户：{portals.length} 个</div>
    </Card>
  );
}
