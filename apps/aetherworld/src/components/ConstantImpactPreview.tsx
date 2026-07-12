import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONSTANT_GROUPS, type ConstantGroupId } from "@/constants/constantGroups";
import { analyzeImpact } from "@/lib/constantImpactAnalyzer";

export function ConstantImpactPreview() {
  const [group, setGroup] = useState<ConstantGroupId>("NUMBER");
  const report = useMemo(() => analyzeImpact(group), [group]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>常数影响分析</CardTitle>
        <p className="text-xs text-muted-foreground">选择一个常数分组，预览修改后将影响哪些模块。</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Select value={group} onValueChange={(v) => setGroup(v as ConstantGroupId)}>
          <SelectTrigger className="w-full md:w-72"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CONSTANT_GROUPS.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="rounded border p-2"><div className="text-xs text-muted-foreground">需重算</div><div>{report.requiresRecalculation ? "是" : "否"}</div></div>
          <div className="rounded border p-2"><div className="text-xs text-muted-foreground">影响事件</div><div>{report.affectedEvents ? "是" : "否"}</div></div>
          <div className="rounded border p-2"><div className="text-xs text-muted-foreground">影响准确率</div><div>{report.affectsAccuracy ? "是" : "否"}</div></div>
          <div className="rounded border p-2"><div className="text-xs text-muted-foreground">影响历史回验</div><div>{report.affectsHistoricalFeedback ? "是" : "否"}</div></div>
          <div className="rounded border p-2"><div className="text-xs text-muted-foreground">影响 Prompt Forge</div><div>{report.affectsPromptForge ? "是" : "否"}</div></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">受影响计算法</div>
          <div className="flex flex-wrap gap-1">
            {report.affectedCalculi.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">将被标记为 stale 的模块</div>
          <div className="flex flex-wrap gap-1">
            {report.staleModules.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
          </div>
        </div>
        <ul className="text-xs text-muted-foreground list-disc pl-4">
          {report.warnings.map((w,i) => <li key={i}>{w}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}
