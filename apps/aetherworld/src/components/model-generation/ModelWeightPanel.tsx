import type { ModelWeight } from "@/lib/model-generation/modelWeightEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ModelWeightPanel({ weights }: { weights: ModelWeight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">权重</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {weights.map(w => (
          <div key={w.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{w.name}</span>
              <span className="text-muted-foreground">{(w.value * 100).toFixed(1)}%</span>
            </div>
            <Progress value={w.value * 100} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
