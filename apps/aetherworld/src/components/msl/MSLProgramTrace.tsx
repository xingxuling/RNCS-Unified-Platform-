import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MSLProgramResult } from "@/lib/msl/mslProgramRunner";

export function MSLProgramTrace({ results }: { results: MSLProgramResult[] }) {
  if (results.length === 0) return null;
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <Card key={i} className="p-4 space-y-3 aether-card-elevated">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">PROGRAM {r.programName}</div>
            <Badge variant="outline">{r.mode}</Badge>
          </div>

          <Section title="阶段轨迹" items={r.phaseTrace} />
          <Section title="世界状态变化" items={r.worldStateChanges} />
          <Section title="生成事件" items={r.generatedEvents} />
          <Section title="生成任务" items={r.generatedQuests} />
          <Section title="渲染变化" items={r.renderShifts} />
          <Section title="物理 / 风险变化" items={r.physicsShifts} />
          <div className="text-xs text-muted-foreground">最终状态：{r.finalState}</div>
        </Card>
      ))}
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-medium mb-1">{title}</div>
      <div className="text-xs text-muted-foreground space-y-0.5 font-mono">
        {items.map((it, i) => <div key={i}>• {it}</div>)}
      </div>
    </div>
  );
}
