import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FEEDBACK_OUTCOME_WEIGHTS, FEEDBACK_TIMING_WEIGHTS, FEEDBACK_BIAS_FLAGS, FEEDBACK_SAMPLE_DISCOUNT } from "@/constants/feedbackConstants";

export function FeedbackConstantPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>回验常数</CardTitle>
        <p className="text-xs text-muted-foreground">回验结果、时机、偏差、样本折扣的统一权重。</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">结果权重</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {FEEDBACK_OUTCOME_WEIGHTS.map((o) => (
              <div key={o.id} className="rounded border p-2 text-xs">
                <div className="font-medium">{o.name}</div>
                <div className="text-muted-foreground">{o.userFriendlyName}</div>
                <div className="font-mono mt-1">{o.delta >= 0 ? "+" : ""}{o.delta}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">时机权重</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {Object.entries(FEEDBACK_TIMING_WEIGHTS).map(([k,v]) => (
              <div key={k} className="rounded border p-2">
                <div>{k}</div>
                <div className="font-mono">{v >= 0 ? "+" : ""}{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">偏差修正</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {Object.entries(FEEDBACK_BIAS_FLAGS).map(([k,v]) => (
              <div key={k} className="rounded border p-2">
                <div className="font-medium">{k}</div>
                <div className="text-muted-foreground">{v.note}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">样本折扣</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {FEEDBACK_SAMPLE_DISCOUNT.map((s) => (
              <div key={s.range} className="rounded border p-2">
                <div>{s.range}</div>
                <div className="font-mono">×{s.factor}</div>
                <div className="text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
