import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConstantGroupCard } from "./ConstantGroupCard";
import { NumberConstantTable } from "./NumberConstantTable";
import { FiveDomainConstantMap } from "./FiveDomainConstantMap";
import { OperatorConstantTable } from "./OperatorConstantTable";
import { TimePhaseConstantTimeline } from "./TimePhaseConstantTimeline";
import { EventConstantMatrix } from "./EventConstantMatrix";
import { FeedbackConstantPanel } from "./FeedbackConstantPanel";
import { PlatformConstantPanel } from "./PlatformConstantPanel";
import { PhysicalRealityConstantPanel } from "./PhysicalRealityConstantPanel";
import { ConstantImpactPreview } from "./ConstantImpactPreview";
import { ConstantVersionHistory } from "./ConstantVersionHistory";
import { FounderConstantEditor } from "./FounderConstantEditor";
import { computeUniverseHealth, ConstantUniverse } from "@/lib/constantUniverseEngine";
import { CONSTANT_GROUPS } from "@/constants/constantGroups";

const COUNT_BY_GROUP: Record<string, number> = {
  NUMBER: ConstantUniverse.numbers.length,
  FIVE_DOMAIN: ConstantUniverse.domains.length,
  OPERATOR: ConstantUniverse.multiplyOperators.length + ConstantUniverse.divideOperators.length,
  TIME_PHASE: ConstantUniverse.timePhases.length,
  EVENT: ConstantUniverse.eventDimensions.length,
  FEEDBACK: ConstantUniverse.feedbackOutcomes.length,
  USER: ConstantUniverse.users.length,
  PLATFORM: ConstantUniverse.platforms.length,
  PHYSICAL: ConstantUniverse.physical.length,
};

export function ConstantUniversePanel({ professional = false }: { professional?: boolean }) {
  const health = useMemo(() => computeUniverseHealth(), []);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>常数宇宙 v1.0 · 系统完整度</CardTitle>
            <Badge variant={health.score >= 70 ? "default" : "secondary"}>{health.score}/100</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            统一的常数来源：所有计算法、事件系统、回验系统都从此读取。
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Progress value={health.score} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="rounded border p-2"><div className="text-muted-foreground">常数总数</div><div className="font-mono">{health.totalConstants}</div></div>
            <div className="rounded border p-2"><div className="text-muted-foreground">分组</div><div className="font-mono">{health.groups}</div></div>
            <div className="rounded border p-2"><div className="text-muted-foreground">漂移</div><div className="font-mono">{health.drift}</div></div>
            <div className="rounded border p-2"><div className="text-muted-foreground">重复</div><div className="font-mono">{health.duplicates}</div></div>
            <div className="rounded border p-2"><div className="text-muted-foreground">占位</div><div className="font-mono">{health.missing}</div></div>
          </div>
          <ul className="text-xs text-muted-foreground list-disc pl-4">
            {health.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CONSTANT_GROUPS.map((g) => (
          <ConstantGroupCard key={g.id} group={g} count={COUNT_BY_GROUP[g.id] ?? 0} />
        ))}
      </div>

      <NumberConstantTable professional={professional} />
      <FiveDomainConstantMap />
      <OperatorConstantTable />
      <TimePhaseConstantTimeline />
      <EventConstantMatrix />
      <FeedbackConstantPanel />
      <PlatformConstantPanel />
      <PhysicalRealityConstantPanel />
      <ConstantImpactPreview />
      <ConstantVersionHistory />
      <FounderConstantEditor />
    </div>
  );
}
