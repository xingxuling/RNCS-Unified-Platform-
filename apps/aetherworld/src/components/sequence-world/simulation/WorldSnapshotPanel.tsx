import type { WorldSnapshot } from "@/lib/sequence-world/simulation/worldSnapshotEngine";

export function WorldSnapshotPanel({ snapshots, onRollback }: { snapshots: WorldSnapshot[]; onRollback?: (id: string) => void }) {
  return (
    <div className="aether-card p-4">
      <h3 className="font-display gold-text mb-2">世界快照</h3>
      {snapshots.length === 0 ? <p className="text-xs text-muted-foreground">暂无快照</p> : (
        <ul className="space-y-2 text-xs">
          {snapshots.slice(-10).reverse().map(s => (
            <li key={s.id} className="aether-card p-2 flex justify-between items-center gap-3">
              <div className="flex-1">
                <div className="text-foreground">Tick {s.tick} · {s.phase}</div>
                <div className="text-muted-foreground">{s.worldStateSummary}</div>
                <div className="text-muted-foreground">区域 {s.activeZones.length} · NPC {s.activeNpcs.length} · 事件 {s.activeEvents.length} · 因果 {s.causalChainLength}</div>
              </div>
              {onRollback && (
                <button className="px-2 py-1 text-xs rounded border border-primary/40 hover:bg-primary/10" onClick={() => onRollback(s.id)}>回滚</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
