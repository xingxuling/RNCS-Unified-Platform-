import type { WorldBeliefSystem } from "@/lib/sequence-world/society/beliefSystemEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BELIEF_FICTION_NOTE } from "@/constants/sequence-world/society/beliefTypes";

export function BeliefSystemPanel({ beliefs }: { beliefs: WorldBeliefSystem[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">信仰体系 · Beliefs（{beliefs.length}）</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {beliefs.map(b => (
          <div key={b.beliefId} className="rounded border p-3 text-sm">
            <div className="font-medium">{b.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">核心神话：{b.coreMyth}</div>
            <div className="mt-1 text-xs">价值：{b.values.join("、")}｜禁忌：{b.taboos.join("、")}</div>
          </div>
        ))}
        <div className="rounded border-amber-500/30 border bg-amber-500/5 p-2 text-[11px] text-amber-200/80">
          {BELIEF_FICTION_NOTE}
        </div>
      </CardContent>
    </Card>
  );
}
