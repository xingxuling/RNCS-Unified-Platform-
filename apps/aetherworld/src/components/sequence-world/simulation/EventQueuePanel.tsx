import type { SimulatedEvent } from "@/lib/sequence-world/simulation/eventScheduler";

export function EventQueuePanel({ events }: { events: SimulatedEvent[] }) {
  const recent = events.slice(-20).reverse();
  return (
    <div className="aether-card p-4">
      <h3 className="font-display gold-text mb-2">事件队列（最近 20）</h3>
      {recent.length === 0 ? <p className="text-xs text-muted-foreground">暂无事件</p> : (
        <ul className="space-y-2 text-xs">
          {recent.map(e => (
            <li key={e.id} className="aether-card p-2">
              <div className="flex justify-between"><span className="text-foreground">{e.title}</span><span className="text-muted-foreground">{e.eventType}</span></div>
              <div className="text-muted-foreground mt-1">压力 {e.pressure.toFixed(2)} · 区域 {e.affectedZones.join(",") || "—"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
