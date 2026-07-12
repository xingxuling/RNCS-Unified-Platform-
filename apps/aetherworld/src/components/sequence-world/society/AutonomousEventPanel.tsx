import type { AutonomousWorldEvent } from "@/lib/sequence-world/society/autonomousEventEngine";
import { AUTONOMOUS_EVENT_LABELS } from "@/constants/sequence-world/society/autonomousEventTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AutonomousEventPanel({ events }: { events: AutonomousWorldEvent[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">自治事件 · Autonomous Events（{events.length}）</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {events.map(e => (
          <div key={e.eventId} className="rounded border p-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{e.title}</div>
              <Badge variant="outline" className="text-[10px]">{AUTONOMOUS_EVENT_LABELS[e.eventType]}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">触发：{e.triggerReason}</div>
            <div className="text-xs">影响：{e.consequences.join("；")}</div>
          </div>
        ))}
        {!events.length && <div className="text-sm text-muted-foreground">本次 tick 无自治事件。</div>}
      </CardContent>
    </Card>
  );
}
