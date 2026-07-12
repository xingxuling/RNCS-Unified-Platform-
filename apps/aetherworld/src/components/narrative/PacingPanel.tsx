import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PacingResult } from "@/lib/narrative/pacingEngine";
import { Progress } from "@/components/ui/progress";

export function PacingPanel({ pacing }: { pacing: PacingResult }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">节奏</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <Progress value={pacing.pacingScore * 100} />
        <div>问题：{pacing.currentIssue.join("、") || "无明显问题"}</div>
        <div>建议：{pacing.recommendedFix.join("、") || "可推进"}</div>
        <div className="text-muted-foreground">下一 Beat：{pacing.nextBeatTiming}</div>
      </CardContent>
    </Card>
  );
}
