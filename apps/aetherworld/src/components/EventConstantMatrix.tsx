import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EVENT_DIMENSION_CONSTANTS, EVENT_GLOBAL_CONSTANTS } from "@/constants/eventConstants";

export function EventConstantMatrix() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>事件常数矩阵 · 15 维度</CardTitle>
        <p className="text-xs text-muted-foreground">事件全局基础参数 + 各维度默认参数。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(EVENT_GLOBAL_CONSTANTS).map(([k,v]) => (
            <div key={k} className="rounded border p-2">
              <div className="text-muted-foreground">{k}</div>
              <div className="font-mono">{v}</div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-2">维度</th>
                <th className="py-2 pr-2">触发权重</th>
                <th className="py-2 pr-2">伪信号风险</th>
                <th className="py-2 pr-2">回验可信</th>
                <th className="py-2 pr-2">敏感度</th>
                <th className="py-2 pr-2">默认动作</th>
                <th className="py-2 pr-2">安全</th>
              </tr>
            </thead>
            <tbody>
              {EVENT_DIMENSION_CONSTANTS.map((e) => (
                <tr key={e.dimensionId} className="border-b last:border-b-0">
                  <td className="py-2 pr-2">{e.name}</td>
                  <td className="py-2 pr-2 font-mono">{e.baseTriggerWeight}</td>
                  <td className="py-2 pr-2 font-mono">{e.falseSignalRisk}</td>
                  <td className="py-2 pr-2 font-mono">{e.feedbackReliability}</td>
                  <td className="py-2 pr-2 font-mono">{e.userSensitivity}</td>
                  <td className="py-2 pr-2"><Badge variant="outline">{e.defaultActionBias}</Badge></td>
                  <td className="py-2 pr-2"><Badge variant={e.safetyLevel === "HIGH" ? "destructive" : "secondary"}>{e.safetyLevel}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
