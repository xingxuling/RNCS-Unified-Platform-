import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MultiWorldEvent } from "@/lib/sequence-world/multiverse/types";

export function MultiWorldEventPanel({ events }: { events: MultiWorldEvent[] }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">多世界事件 · Multi-World Events</h3>
      {events.length === 0 ? (
        <div className="text-xs text-muted-foreground">本 tick 无多世界事件。每 tick 最多 1 个主事件。</div>
      ) : (
        <ul className="text-xs space-y-2">
          {events.map((e) => (
            <li key={e.eventId} className="rounded border border-border/50 p-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{e.title}</div>
                <Badge variant="outline" className="text-[10px]">{e.eventType}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground">触发：{e.triggerReason}</div>
              <div className="text-[11px]">影响：{e.consequences.join("；")}</div>
              {e.safetyNotes.length > 0 && <div className="text-[10px] text-amber-400 mt-1">⚠ {e.safetyNotes.join(" · ")}</div>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
