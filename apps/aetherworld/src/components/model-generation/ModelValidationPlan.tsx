import type { ModelValidationPlan } from "@/lib/model-generation/modelValidationPlanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ModelValidationPlanCard({ plan }: { plan: ModelValidationPlan }) {
  const Row = ({ label, items }: { label: string; items: string[] }) => (
    <div>
      <div className="text-xs font-medium mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.length ? items.map(i => <Badge key={i} variant="outline" className="text-xs">{i}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
      </div>
    </div>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">回验计划</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">{plan.validationGoal}</div>
        <Row label="可测信号" items={plan.measurableSignals} />
        <Row label="反馈字段" items={plan.feedbackFields} />
        <Row label="成功标志" items={plan.successCriteria} />
        <Row label="失败信号" items={plan.failureSignals} />
        <Row label="重算触发" items={plan.recalculationTriggers} />
      </CardContent>
    </Card>
  );
}
