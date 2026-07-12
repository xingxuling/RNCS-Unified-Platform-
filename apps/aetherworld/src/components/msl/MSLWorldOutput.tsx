import { Card } from "@/components/ui/card";
import { MSLInterpretation } from "@/lib/msl/mslInterpreter";

export function MSLWorldOutput({ interpretations }: { interpretations: MSLInterpretation[] }) {
  if (interpretations.length === 0) return null;
  return (
    <Card className="p-4 space-y-3 aether-card-elevated">
      <div className="text-sm font-medium">Interpretation · 世界语义</div>
      <div className="space-y-3">
        {interpretations.map((it, i) => (
          <div key={i} className="border border-border rounded p-3 space-y-1 text-xs">
            <div className="text-sm font-mono">{it.statement}</div>
            <div className="text-muted-foreground">{it.summary}</div>
            <div>{it.domainMeanings.heaven}</div>
            <div>{it.domainMeanings.earth}</div>
            <div>{it.domainMeanings.human}</div>
            <div>{it.domainMeanings.spirit}</div>
            <div>{it.domainMeanings.wind}</div>
            <div className="text-muted-foreground">终端：{it.terminalMeaning}</div>
            <div>主导操作码：{it.dominantOpcodes.join("，") || "无"}</div>
            <div>缺位操作码：{it.missingOpcodes.join("，") || "无"}</div>
            <div>行动倾向：{it.actionBias.join("，")}</div>
            <div>世界倾向：{it.worldBias.join("，") || "无"}</div>
            {it.riskFlags.length > 0 && (
              <div className="text-amber-500">⚠ 风险：{it.riskFlags.join("，")}</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
