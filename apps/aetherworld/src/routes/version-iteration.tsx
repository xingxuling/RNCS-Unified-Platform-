import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

import {
  computeVersionIteration,
  VERSION_STATUS_META,
} from "@/lib/versionIterationCalculus";
import { computeBetaLaunch } from "@/lib/betaLaunchCalculus";
import {
  DEFAULT_VERSION_FACTOR_SCORES,
  VERSION_POSITIVE_FACTORS,
  VERSION_NEGATIVE_FACTORS,
  type VersionFactorScores,
} from "@/constants/versionReadinessFactors";

import { VersionReadinessPanel } from "@/components/VersionReadinessPanel";
import { ModuleStabilityMatrix } from "@/components/ModuleStabilityMatrix";
import { ReleaseGateChecklist } from "@/components/ReleaseGateChecklist";
import { VersionRoadmapBoard } from "@/components/VersionRoadmapBoard";
import { V1LaunchSummary } from "@/components/V1LaunchSummary";
import { PostV1IterationPlan } from "@/components/PostV1IterationPlan";
import { useAetherData } from "@/lib/useAetherData";
import { calculateAccuracy, sampleTierMessage } from "@/lib/predictionAccuracyCalculator";
import { ACCURACY_TARGET } from "@/constants/accuracyMetrics";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/version-iteration")({
  head: () => ({
    meta: [
      { title: "版本迭代 · Version Iteration — Aether Fate Engine v1.0" },
      {
        name: "description",
        content:
          "Version Iteration Calculus：判断系统是否真正具备 v1.0 内测候选资格，标记模块稳定等级，给出发布闸口与 v1.x→v2.0 路线。",
      },
    ],
  }),
  component: VersionIterationPage,
});

function VersionIterationPage() {
  const [factors, setFactors] = useState<VersionFactorScores>({
    ...DEFAULT_VERSION_FACTOR_SCORES,
  });

  const beta = useMemo(() => computeBetaLaunch(), []);
  const result = useMemo(
    () => computeVersionIteration({ factors, betaResult: beta }),
    [factors, beta],
  );

  const setFactor = (key: keyof VersionFactorScores, value: number) =>
    setFactors((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <PageHeader
        caption="Version Iteration Calculus Engine · 版本迭代计算引擎"
        title="版本迭代"
        subtitle="判断系统是否真正具备 v1.0 内测候选资格，标记模块稳定等级，给出发布闸口与 v1.x→v2.0 路线。"
      >
        <Badge
          variant="outline"
          className={
            result.canMarkAsV1
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
          }
        >
          {result.recommendedVersion}
        </Badge>
      </PageHeader>

      <div className="p-6 md:p-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VersionReadinessPanel result={result} />
          <V1LaunchSummary result={result} />
        </div>

        <Tabs defaultValue="checklist" className="w-full">
          <TabsList className="aether-card">
            <TabsTrigger value="checklist">发布闸口</TabsTrigger>
            <TabsTrigger value="modules">模块矩阵</TabsTrigger>
            <TabsTrigger value="roadmap">版本路线</TabsTrigger>
            <TabsTrigger value="post">v1 之后</TabsTrigger>
            <TabsTrigger value="factors">参数调节</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="mt-4">
            <ReleaseGateChecklist items={result.gateChecklist} />
          </TabsContent>

          <TabsContent value="modules" className="mt-4">
            <ModuleStabilityMatrix />
          </TabsContent>

          <TabsContent value="roadmap" className="mt-4">
            <VersionRoadmapBoard />
          </TabsContent>

          <TabsContent value="post" className="mt-4">
            <PostV1IterationPlan roadmap={result.postV1Roadmap} />
          </TabsContent>

          <TabsContent value="factors" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FactorGroup
                title="正向因子"
                en="Positive Factors"
                tone="emerald"
                factors={Object.values(VERSION_POSITIVE_FACTORS)}
                scores={factors}
                onChange={setFactor}
              />
              <FactorGroup
                title="负向因子"
                en="Negative Factors"
                tone="rose"
                factors={Object.values(VERSION_NEGATIVE_FACTORS)}
                scores={factors}
                onChange={setFactor}
              />
            </div>
            {result.notes.length > 0 && (
              <div className="aether-card p-4 mt-4 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  备注
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  {result.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AccuracyReadinessCard />



        <div className="aether-card p-4 text-[11px] text-muted-foreground leading-relaxed">
          v1.0 表示「私密内测候选版」(Private Beta Candidate)，不代表公开正式发布。系统仍处于结构化预测实验阶段，所有预测必须经过回验修正。本系统不构成医疗、法律、金融、投资或心理诊断建议。真实主体 60 组数列属于敏感数据，默认仅本地保存。
        </div>
      </div>
    </>
  );
}

function FactorGroup({
  title,
  en,
  tone,
  factors,
  scores,
  onChange,
}: {
  title: string;
  en: string;
  tone: "emerald" | "rose";
  factors: { key: string; cn: string; en: string; desc: string }[];
  scores: VersionFactorScores;
  onChange: (key: keyof VersionFactorScores, value: number) => void;
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300/80 border-emerald-500/20"
      : "text-rose-300/80 border-rose-500/20";
  return (
    <div className={`aether-card p-4 space-y-3 border ${toneClass}`}>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{en}</div>
        <div className="text-sm font-medium mt-0.5">{title}</div>
      </div>
      <div className="space-y-3">
        {factors.map((f) => {
          const value = scores[f.key as keyof VersionFactorScores] ?? 0;
          return (
            <div key={f.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span>{f.cn}</span>
                  <span className="text-muted-foreground ml-2 text-[10px]">{f.en}</span>
                </div>
                <span className="tabular-nums text-muted-foreground">{value}</span>
              </div>
              <Slider
                value={[value]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => onChange(f.key as keyof VersionFactorScores, v[0] ?? 0)}
              />
              <div className="text-[10px] text-muted-foreground">{f.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AccuracyReadinessCard() {
  const { feedback } = useAetherData();
  const report = useMemo(() => calculateAccuracy(feedback), [feedback]);
  const confidenceLevel =
    report.sampleTier === "ready" ? "充分校准"
      : report.sampleTier === "early" ? "早期校准"
        : "未校准";
  return (
    <div className="aether-card p-5 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Accuracy Readiness · 准确率发布就绪
          </div>
          <h2 className="font-display text-lg mt-0.5">v1.0 是否可对外宣称已达到 {ACCURACY_TARGET.label}</h2>
        </div>
        <Badge variant={report.canClaimPublicly ? "default" : "secondary"}>
          Can Claim Publicly: {report.canClaimPublicly ? "YES" : "NO"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <Cell label="Theoretical Target" value={ACCURACY_TARGET.label} />
        <Cell label="Current Verified" value={report.validRecords === 0 ? "—" : `${report.overall}%`} />
        <Cell label="Sample Size" value={String(report.validRecords)} />
        <Cell label="Confidence Level" value={confidenceLevel} />
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {sampleTierMessage(report.sampleTier)} 详情见
        <Link to="/accuracy" className="underline text-primary ml-1">预测有效率页</Link>。
      </p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/10 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-base mt-0.5">{value}</div>
    </div>
  );
}
