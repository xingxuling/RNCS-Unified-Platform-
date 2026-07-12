import type { SimulatedWorldState } from "@/lib/sequence-world/simulation/worldSimulationCore";
import { WORLD_PHASES } from "@/constants/sequence-world/simulation/worldPhases";

export function WorldStateMachineCard({ state }: { state: SimulatedWorldState }) {
  const phase = WORLD_PHASES.find(p => p.id === state.phase);
  return (
    <div className="aether-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display gold-text">世界状态机</h3>
        <span className="px-2 py-1 rounded text-xs bg-primary/15 border border-primary/40">{phase?.label ?? state.phase}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <Stat label="Tick" value={String(state.tick)} />
        <Stat label="熵" value={state.entropyLevel.toFixed(2)} />
        <Stat label="稳定度" value={state.stability.toFixed(2)} />
        <Stat label="事件压力" value={state.eventPressure.toFixed(2)} />
        <Stat label="NPC 活跃" value={state.npcActivity.toFixed(2)} />
        <Stat label="因果密度" value={String(state.causalDensity)} />
      </div>
      <p className="text-sm pt-2 border-t border-border/40">{state.summary}</p>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span>{label}</span><span className="text-foreground">{value}</span></div>;
}
