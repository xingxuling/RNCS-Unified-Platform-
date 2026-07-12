import type { CivilizationPhaseState } from "@/lib/sequence-world/society/civilizationPhaseEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CivilizationPhasePanel({ phase }: { phase: CivilizationPhaseState }) {
  const m = (n: number) => `${(n * 100).toFixed(0)}%`;
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">文明阶段 · Civilization Phase</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-lg font-medium">{phase.phaseLabel}</div>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <div className="rounded border p-2"><div className="text-muted-foreground">稳定</div><div>{m(phase.stability)}</div></div>
          <div className="rounded border p-2"><div className="text-muted-foreground">复杂度</div><div>{m(phase.complexity)}</div></div>
          <div className="rounded border p-2"><div className="text-muted-foreground">技术</div><div>{m(phase.technologyLevel)}</div></div>
          <div className="rounded border p-2"><div className="text-muted-foreground">规则/魔法</div><div>{m(phase.magicOrRuleLevel)}</div></div>
          <div className="rounded border p-2"><div className="text-muted-foreground">社会信任</div><div>{m(phase.socialTrust)}</div></div>
          <div className="rounded border p-2"><div className="text-muted-foreground">资源基础</div><div>{m(phase.resourceBase)}</div></div>
          <div className="rounded border p-2"><div className="text-muted-foreground">叙事成熟度</div><div>{m(phase.narrativeMaturity)}</div></div>
        </div>
        <div className="text-xs text-muted-foreground">{phase.nextPhaseHint}</div>
      </CardContent>
    </Card>
  );
}
