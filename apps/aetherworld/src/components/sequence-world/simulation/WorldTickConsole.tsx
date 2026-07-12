import { useState } from "react";
import type { WorldSimulationResult } from "@/lib/sequence-world/simulation/worldSimulationCore";
import { runTick, runManyTicks } from "@/lib/sequence-world/simulation/worldSimulationCore";
import { createSnapshot, saveSnapshots } from "@/lib/sequence-world/simulation/worldSnapshotEngine";

export function WorldTickConsole({ sim, onUpdate }: { sim: WorldSimulationResult; onUpdate: (s: WorldSimulationResult) => void }) {
  const [action, setAction] = useState("");
  return (
    <div className="aether-card p-4 space-y-2">
      <h3 className="font-display gold-text">Tick 控制台</h3>
      <div className="flex gap-2 flex-wrap">
        <button className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground" onClick={() => onUpdate(runTick(sim))}>Run Tick</button>
        <button className="px-3 py-1 text-xs rounded border border-primary/40 hover:bg-primary/10" onClick={() => onUpdate(runManyTicks(sim, 10, sim.simulationMode))}>Run 10 Ticks</button>
        <button className="px-3 py-1 text-xs rounded border border-primary/40 hover:bg-primary/10" onClick={() => {
          const snap = createSnapshot({
            worldId: sim.worldId, worldState: sim.worldState, zones: sim.activeZones, npcs: sim.activeNpcs,
            events: sim.activeEvents, resources: sim.resourceFlow.resources, causalChainLength: sim.causalChain.length,
            notes: ["手动快照"],
          });
          const next = [...sim.snapshots, snap];
          saveSnapshots(next);
          onUpdate({ ...sim, snapshots: next });
        }}>Create Snapshot</button>
      </div>
      <div className="flex gap-2 items-center">
        <input value={action} onChange={e => setAction(e.target.value)} placeholder="用户行动 (作为 USER_ACTION 推进)"
          className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs" />
        <button className="px-3 py-1 text-xs rounded border border-primary/40 hover:bg-primary/10"
          disabled={!action.trim()} onClick={() => { onUpdate(runTick(sim, { tickType: "USER_FEEDBACK", userAction: action })); setAction(""); }}>
          以行动推进
        </button>
      </div>
      {sim.warnings.length > 0 && (
        <div className="text-xs text-amber-300">⚠ {sim.warnings.join("；")}</div>
      )}
    </div>
  );
}
