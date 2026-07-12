import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { useAetherData } from "@/lib/useAetherData";
import { calculateAccuracy } from "@/lib/predictionAccuracyCalculator";
import { ACCURACY_TARGET } from "@/constants/accuracyMetrics";

import {
  computeBetaLaunch,
  generateInviteCopy,
  BETA_STATUS_META,
  type BetaLaunchInput,
} from "@/lib/betaLaunchCalculus";
import {
  DEFAULT_BETA_FACTOR_SCORES,
  BETA_POSITIVE_FACTORS,
  BETA_NEGATIVE_FACTORS,
  type BetaFactorScores,
} from "@/constants/betaLaunchFactors";
import { BETA_USER_SEGMENTS, BETA_USER_SEGMENT_LIST, type BetaUserSegmentId } from "@/constants/betaUserSegments";

import { BetaReadinessPanel } from "@/components/BetaReadinessPanel";
import { BetaAccessMatrix } from "@/components/BetaAccessMatrix";
import { BetaUserSegmentCard } from "@/components/BetaUserSegmentCard";
import { BetaRiskGate } from "@/components/BetaRiskGate";
import { BetaFeatureGate } from "@/components/BetaFeatureGate";
import { BetaFeedbackPlan } from "@/components/BetaFeedbackPlan";
import { BetaLaunchTimeline } from "@/components/BetaLaunchTimeline";
import { FeedbackEntryCard } from "@/components/FeedbackEntryCard";

export const Route = createFileRoute("/beta-launch")({
  head: () => ({
    meta: [
      { title: "内测发布 · Beta Launch — Aether Fate Engine" },
      { name: "description", content: "Beta Launch Calculus：判断当前系统适合的内测阶段、用户分层、功能开放、风险门与反馈计划。" },
    ],
  }),
  component: BetaLaunchPage,
});

const REGIONS = ["GLOBAL", "HK", "CN", "TW", "SG", "JP", "US", "ENTERPRISE", "RESEARCH", "CREATOR"];

function BetaLaunchPage() {
  const [factors, setFactors] = useState<BetaFactorScores>({ ...DEFAULT_BETA_FACTOR_SCORES });
  const [targetRegion, setTargetRegion] = useState<string>("GLOBAL");
  const [pickedSegment, setPickedSegment] = useState<BetaUserSegmentId>("TRUSTED_EXPERT");

  const input: BetaLaunchInput = { factors, targetRegion };
  const result = useMemo(() => computeBetaLaunch(input), [factors, targetRegion]);
  const invite = useMemo(
    () => generateInviteCopy(pickedSegment, result.recommendedStatus),
    [pickedSegment, result.recommendedStatus],
  );

  const setFactor = (key: keyof BetaFactorScores, value: number) =>
    setFactors((prev) => ({ ...prev, [key]: value }));

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`【${invite.title}】\n\n${invite.body}`);
      toast.success("已复制邀请文案");
    } catch {
      toast.error("复制失败，请手动选择文本");
    }
  };

  return (
    <>
      <PageHeader
        caption="Beta Launch Calculus Engine · 内测发布计算引擎"
        title="内测发布"
        subtitle="判断当前系统是否适合内测、适合哪种内测、开放给谁、开放哪些功能、如何收集回验、如何控制误用风险。"
      />

      <div className="p-6 md:p-10 space-y-6">
        {/* Region picker */}
        <div className="aether-card p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Target Audience Region</div>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => {
              const active = targetRegion === r;
              return (
                <button
                  key={r}
                  onClick={() => setTargetRegion(r)}
                  className={`text-[11px] px-2.5 py-1 rounded border transition ${
                    active
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <BetaReadinessPanel result={result} />

        <Tabs defaultValue="segments">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="segments">用户分层</TabsTrigger>
            <TabsTrigger value="access">访问矩阵</TabsTrigger>
            <TabsTrigger value="features">功能门</TabsTrigger>
            <TabsTrigger value="risks">风险门</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="feedback">反馈计划</TabsTrigger>
            <TabsTrigger value="timeline">时间线</TabsTrigger>
            <TabsTrigger value="invite">邀请文案</TabsTrigger>
            <TabsTrigger value="factors">因子调参</TabsTrigger>
          </TabsList>

          <TabsContent value="segments" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {BETA_USER_SEGMENT_LIST.map((seg) => (
                <BetaUserSegmentCard
                  key={seg.id}
                  segment={seg}
                  recommended={result.recommendedUserSegments.includes(seg.id)}
                  active={pickedSegment === seg.id}
                  onPick={setPickedSegment}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="access" className="mt-4">
            <BetaAccessMatrix recommendedAccessLevels={result.recommendedAccessLevels} />
          </TabsContent>

          <TabsContent value="features" className="mt-4">
            <BetaFeatureGate gates={result.featureGates} />
          </TabsContent>

          <TabsContent value="risks" className="mt-4">
            <BetaRiskGate risks={result.launchRisks} publicLaunchBlocked={result.publicLaunchBlocked} />
          </TabsContent>

          <TabsContent value="onboarding" className="mt-4">
            <div className="aether-card p-5 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beta Onboarding</div>
                <div className="font-display text-lg gold-text">内测 Onboarding 流程</div>
              </div>
              <ol className="space-y-2">
                {result.onboardingRequirements.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-muted-foreground/60 mr-2">{String(i + 1).padStart(2, "0")}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            <BetaFeedbackPlan plan={result.feedbackPlan} warnings={result.requiredWarnings} />
            <div className="aether-card p-5 mt-4 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pause Conditions</div>
                <div className="font-display text-lg gold-text">暂停条件</div>
              </div>
              <ul className="space-y-1.5">
                {result.pauseConditions.map((c, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">⛔ {c}</li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <BetaLaunchTimeline current={result.recommendedStatus} />
          </TabsContent>

          <TabsContent value="invite" className="mt-4">
            <div className="aether-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Invite Copy Generator</div>
                  <div className="font-display text-lg gold-text">内测邀请文案</div>
                </div>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  目标群体：{BETA_USER_SEGMENTS[pickedSegment].cn}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BETA_USER_SEGMENT_LIST.map((seg) => {
                  const active = pickedSegment === seg.id;
                  return (
                    <button
                      key={seg.id}
                      onClick={() => setPickedSegment(seg.id)}
                      className={`text-left rounded-md border p-2 text-[11px] transition ${
                        active
                          ? "border-primary/60 bg-primary/5"
                          : "border-border bg-secondary/20 hover:border-primary/40"
                      }`}
                    >
                      <div className="font-display text-[12px]">{seg.cn}</div>
                      <div className="text-[10px] text-muted-foreground">{seg.en}</div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-md border border-border bg-secondary/20 p-4 space-y-2">
                <div className="font-display text-sm gold-text">{invite.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{invite.body}</div>
              </div>

              <Button variant="outline" size="sm" onClick={copyInvite}>
                <Copy className="w-3.5 h-3.5 mr-1" /> 复制邀请文案
              </Button>

              <div className="text-[10px] text-muted-foreground/70 italic leading-relaxed">
                文案禁用：绝对预测未来 / 改变命运 / 算准你的人生 / 神级预测 / 保证命中。<br />
                推荐表达：结构预测 / 时间窗口 / 行动许可 / 回验修正 / 个人决策辅助 / 不替代专业建议。
              </div>
            </div>
          </TabsContent>

          <TabsContent value="factors" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FactorPanel
                title="正向因子"
                tone="emerald"
                metas={Object.values(BETA_POSITIVE_FACTORS)}
                factors={factors}
                onChange={setFactor}
              />
              <FactorPanel
                title="负向因子（越低越好）"
                tone="amber"
                metas={Object.values(BETA_NEGATIVE_FACTORS)}
                factors={factors}
                onChange={setFactor}
              />
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFactors({ ...DEFAULT_BETA_FACTOR_SCORES });
                  toast.success("已恢复默认因子");
                }}
              >
                恢复默认
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <BetaAccuracyClaimGate />

        <FeedbackEntryCard title="快速回验 · 内测发布" detailLink="/feedback" />

        <div className="text-[11px] text-muted-foreground/70 italic leading-relaxed">
          当前推荐：{BETA_STATUS_META[result.recommendedStatus].cn} · {BETA_STATUS_META[result.recommendedStatus].en}。
          预测 ≠ 断言未来；行动可改变结果。真实主体数据仅本地保存。
        </div>
      </div>
    </>
  );
}

function FactorPanel({
  title,
  tone,
  metas,
  factors,
  onChange,
}: {
  title: string;
  tone: "emerald" | "amber";
  metas: { key: string; cn: string; en: string; desc: string }[];
  factors: BetaFactorScores;
  onChange: (key: keyof BetaFactorScores, value: number) => void;
}) {
  const valueColor = tone === "emerald" ? "text-emerald-400" : "text-amber-400";
  return (
    <div className="aether-card p-5 space-y-4">
      <div className="font-display text-base gold-text">{title}</div>
      {metas.map((m) => {
        const v = factors[m.key as keyof BetaFactorScores];
        return (
          <div key={m.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span>
                {m.cn}
                <span className="text-muted-foreground ml-1">· {m.en}</span>
              </span>
              <span className={`font-mono ${valueColor}`}>{v}</span>
            </div>
            <Slider
              value={[v]}
              min={0}
              max={100}
              step={1}
              onValueChange={([nv]) => onChange(m.key as keyof BetaFactorScores, nv)}
            />
            <div className="text-[10px] text-muted-foreground/70">{m.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function BetaAccuracyClaimGate() {
  const { feedback } = useAetherData();
  const r = useMemo(() => calculateAccuracy(feedback), [feedback]);

  let claimLevel: { label: string; tone: "muted" | "amber" | "primary" };
  let claimText: string;
  if (r.validRecords < 30) {
    claimLevel = { label: "暂不可声称", tone: "muted" };
    claimText = `回验样本 ${r.validRecords} < 30，不能对外显示「已达到 ${ACCURACY_TARGET.label}」。`;
  } else if (r.validRecords < 100) {
    claimLevel = { label: "可显示早期回验有效率", tone: "amber" };
    claimText = `回验样本 ${r.validRecords}（30–100），可显示「早期回验有效率：${r.overall}%」，但不能等同于已验证准确率。`;
  } else if (r.overall >= 90) {
    claimLevel = { label: "可显示高有效率", tone: "primary" };
    claimText = `回验样本 ${r.validRecords} ≥ 100 且综合有效率 ${r.overall}% ≥ 90%，可显示「内测回验显示高有效率」。`;
  } else {
    claimLevel = { label: "样本充足但有效率未达标", tone: "amber" };
    claimText = `回验样本 ${r.validRecords} ≥ 100，但综合有效率 ${r.overall}% < 90%，不能声称已达 ${ACCURACY_TARGET.label}。`;
  }

  const directionLead =
    r.validRecords >= 30 && r.dimensions.direction.rate >= 80 && r.dimensions.timing_window.rate < 60;

  return (
    <div className="aether-card p-5 space-y-3">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Beta Accuracy Claim Gate · 准确率宣传准入
          </div>
          <h2 className="font-display text-lg mt-0.5">回验有效率允许的宣传文案层级</h2>
        </div>
        <Badge variant={claimLevel.tone === "primary" ? "default" : "secondary"}>
          {claimLevel.label}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{claimText}</p>
      {directionLead && (
        <div className="text-xs rounded-md p-3 border border-amber-500/30 bg-amber-500/5 text-amber-300">
          系统更适合判断方向与行动许可，而非精确单日断言。
        </div>
      )}
      <div className="text-[11px] text-muted-foreground">
        详细分层准确率见
        <Link to="/accuracy" className="underline text-primary ml-1">预测有效率页</Link>
        ；回验在
        <Link to="/feedback" className="underline text-primary ml-1">回验中心</Link>。
      </div>
    </div>
  );
}
