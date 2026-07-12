import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { planCalibration } from "@/lib/reality-data/realityCalibrationPlanner";

export function CalibrationPlanPanel() {
  const [q, setQ] = useState("中国内地关键组织排名为什么下降");
  const [plan, setPlan] = useState(planCalibration(q));
  return (
    <Card className="p-4 space-y-3">
      <div className="text-sm font-medium">现实校准计划</div>
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={() => setPlan(planCalibration(q))}>分析</Button>
      </div>
      <div className="text-xs space-y-1">
        <div><Badge>{plan.questionType}</Badge> <span className="text-muted-foreground">{plan.label}</span></div>
        <div>主体数列权重：{plan.subjectSequenceWeight}</div>
        <div>外部数据权重：{plan.externalDataWeight}</div>
        <div>回验权重：{plan.validationWeight}</div>
        <div>安全权重：{plan.safetyWeight}</div>
        <div>建议接入外部数据：{plan.shouldUseExternalData ? "是" : "否"}</div>
        <div className="text-muted-foreground">原因：{plan.reason}</div>
        {plan.detectedKeywords.length > 0 && (
          <div className="text-muted-foreground">命中关键词：{plan.detectedKeywords.join("、")}</div>
        )}
      </div>
    </Card>
  );
}
