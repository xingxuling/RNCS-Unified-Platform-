import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAetherData } from "@/lib/useAetherData";
import { loadWeightState, saveWeightState, resetWeightState } from "@/lib/feedbackWeightStore";
import {
  applyFeedback,
  computeEvolutionScore,
  getEngineWeightDisplay,
  biasDistribution,
  determinationReliabilityRate,
  inferBiasTypes,
  type SubjectWeightState,
  type EnrichedFeedback,
} from "@/lib/feedbackWeightEngine";
import { FEEDBACK_BIAS_TYPES, BIAS_LIST, type FeedbackBiasType } from "@/constants/feedbackBiasTypes";
import { PersonalModelEvolutionCard } from "@/components/PersonalModelEvolutionCard";
import { EngineWeightMatrix } from "@/components/EngineWeightMatrix";
import { FeedbackWeightPanel } from "@/components/FeedbackWeightPanel";
import { FeedbackLearningTimeline } from "@/components/FeedbackLearningTimeline";
import { FeedbackImpactChart } from "@/components/FeedbackImpactChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Info, RefreshCcw, Sparkles } from "lucide-react";
import type { DeterminationStatus } from "@/constants/determinationStates";

export const Route = createFileRoute("/feedback-weights")({ component: FeedbackWeightsPage });

function FeedbackWeightsPage() {
  const { active, feedback } = useAetherData();
  const [state, setState] = useState<SubjectWeightState | null>(null);

  // 加载当前主体权重状态
  useEffect(() => {
    if (!active) return;
    setState(loadWeightState(active.id));
  }, [active?.id]);

  // 将既有 FeedbackRecord 映射为 enriched
  const enrichedRecords: EnrichedFeedback[] = useMemo(
    () => feedback.map((f) => ({
      ...f,
      hitAccuracy: f.hitScore,
      eventTypeMatch: f.typeMatched ? 90 : 30,
      timingAccuracy: f.intensityMatched ? 80 : 50,
      actionValidity: f.actionWorked ? 85 : 35,
      noiseInfluence: (f.noise?.length ?? 0) * 20,
    })),
    [feedback],
  );

  const evolutionScore = useMemo(
    () => state ? computeEvolutionScore(state, enrichedRecords) : 0,
    [state, enrichedRecords],
  );

  const engineDisplay = useMemo(
    () => state ? getEngineWeightDisplay(state) : [],
    [state],
  );

  const biasData = useMemo(
    () => state ? biasDistribution(state) : [],
    [state],
  );

  const hitRate = useMemo(() => {
    if (!feedback.length) return 0;
    return Math.round((feedback.filter((f) => f.hit).length / feedback.length) * 100);
  }, [feedback]);

  // 重新基于现有回验记录批量重算（一键学习）
  const recomputeFromHistory = () => {
    if (!active) return;
    let s: SubjectWeightState = {
      ...loadWeightState(active.id),
      engineWeights: { ...loadWeightState(active.id).engineWeights },
      history: [],
      biasCounts: {},
      determinationReliability: {
        UNDETERMINED:        { hits: 0, total: 0 },
        SEMI_DETERMINED:     { hits: 0, total: 0 },
        NEAR_DETERMINED:     { hits: 0, total: 0 },
        DETERMINED:          { hits: 0, total: 0 },
        REVERSE_DETERMINED:  { hits: 0, total: 0 },
        FALSE_DETERMINED:    { hits: 0, total: 0 },
      },
    };
    const sorted = [...enrichedRecords].sort((a, b) => a.date.localeCompare(b.date));
    for (const r of sorted) {
      const { state: next } = applyFeedback(s, { ...r, biasTypes: r.biasTypes ?? inferBiasTypes(r) });
      s = next;
    }
    saveWeightState(s);
    setState(s);
  };

  const resetWeights = () => {
    if (!active) return;
    resetWeightState(active.id);
    setState(loadWeightState(active.id));
  };

  if (!active || !state) return null;

  const calibrationNotice =
    feedback.length < 10
      ? "当前主体模型仍处于早期校准阶段，定数判断仅供参考。"
      : feedback.length >= 30
        ? "当前主体模型已具备初步个体校准能力。"
        : "继续完成回验，使个人模型更贴近主体。";

  const lastEvent = state.history[0];

  return (
    <>
      <PageHeader
        caption="Feedback Weight Engine · 回验权重计算引擎"
        title="模型正在学习"
        subtitle="每一次回验都会反向修正各计算法、常数与定数判断的权重，让系统持续贴近当前主体。"
      />

      <div className="p-6 md:p-10 space-y-6">
        {/* 安全边界 */}
        <div className="aether-card border-primary/20 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-foreground/85 leading-relaxed">
            回验权重计算法用于改善结构预测模型，不代表绝对准确性。历史命中率不保证未来必然命中，用户行动会改变预测结果。
            <span className="text-primary/90 ml-1">{calibrationNotice}</span>
          </div>
        </div>

        {/* 顶部三卡 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PersonalModelEvolutionCard
            score={evolutionScore}
            feedbackCount={feedback.length}
            hitRate={hitRate}
          />
          <FeedbackWeightPanel event={lastEvent} />
          <ReliabilityCard state={state} />
        </div>

        {/* 操作 */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={recomputeFromHistory} variant="default" size="sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            基于历史回验重算权重
          </Button>
          <Button onClick={resetWeights} variant="outline" size="sm">
            <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
            恢复默认权重
          </Button>
          <QuickFeedbackForm
            onSubmit={(rec) => {
              const { state: next } = applyFeedback(state, rec);
              saveWeightState(next);
              setState(next);
            }}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="matrix" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
            <TabsTrigger value="matrix">引擎矩阵</TabsTrigger>
            <TabsTrigger value="learning">权重学习</TabsTrigger>
            <TabsTrigger value="bias">偏差分析</TabsTrigger>
            <TabsTrigger value="evolution">个人进化</TabsTrigger>
            <TabsTrigger value="bias-types">偏差类型</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-4">
            <EngineWeightMatrix data={engineDisplay} />
          </TabsContent>

          <TabsContent value="learning" className="space-y-4">
            <FeedbackLearningTimeline events={state.history} />
          </TabsContent>

          <TabsContent value="bias" className="space-y-4">
            <FeedbackImpactChart data={biasData} />
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <PersonalModelEvolutionCard
              score={evolutionScore}
              feedbackCount={feedback.length}
              hitRate={hitRate}
            />
            <div className="aether-card-elevated p-5">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Evolution Formula</div>
              <div className="font-display text-lg gold-text mt-1">进化公式</div>
              <pre className="mt-3 text-[11px] font-mono text-foreground/85 leading-relaxed whitespace-pre-wrap">
{`Evolution =
  min(N/40, 1)
× (0.3 + HitRate × 0.7)
× (0.4 + Recent30Rate × 0.6)
× (0.4 + BiasExplainRate × 0.6)
× (0.4 + Stability × 0.6)
× (1 - NoiseRatio × 0.5)`}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="bias-types" className="space-y-3">
            <div className="aether-card-elevated p-5">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Bias Type Reference</div>
              <div className="font-display text-lg gold-text mt-1">偏差类型词典</div>
              <div className="gold-divider my-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BIAS_LIST.map((b) => (
                  <div key={b.key} className="rounded-md border border-border/60 p-3 bg-secondary/10">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">{b.label}</div>
                      <div className="text-[10px] text-muted-foreground tracking-wider">{b.en}</div>
                    </div>
                    <div className="mt-1 text-xs text-foreground/85">{b.desc}</div>
                    {b.affects.length > 0 && (
                      <div className="mt-2 text-[10px] text-primary/80 font-mono">
                        影响：{Object.entries(b.adjustments).map(([k, v]) => `${k}${v > 0 ? "+" : ""}${v}`).join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function ReliabilityCard({ state }: { state: SubjectWeightState }) {
  const statuses: DeterminationStatus[] = [
    "UNDETERMINED", "SEMI_DETERMINED", "NEAR_DETERMINED",
    "DETERMINED", "REVERSE_DETERMINED", "FALSE_DETERMINED",
  ];
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Determination Reliability</div>
      <div className="font-display text-lg gold-text mt-1">定数历史可靠度</div>
      <div className="text-xs text-muted-foreground mt-1">各定数状态在该主体历史中的命中率。</div>
      <div className="gold-divider my-3" />
      <div className="space-y-2">
        {statuses.map((s) => {
          const r = determinationReliabilityRate(state, s);
          return (
            <div key={s}>
              <div className="flex justify-between text-xs">
                <span>{r.label}</span>
                <span className="font-mono text-muted-foreground">
                  {r.total ? `${r.rate}% · ${r.total} 次` : "—"}
                </span>
              </div>
              <div className="h-1 mt-1 rounded-full bg-muted/20 overflow-hidden">
                <div className="h-full bg-primary/70" style={{ width: `${r.rate}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickFeedbackForm({ onSubmit }: { onSubmit: (r: EnrichedFeedback) => void }) {
  const [open, setOpen] = useState(false);
  const [hit, setHit] = useState(true);
  const [biasTypes, setBiasTypes] = useState<FeedbackBiasType[]>([]);

  const toggle = (b: FeedbackBiasType) => {
    setBiasTypes((cur) => cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]);
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="secondary" size="sm">
        + 模拟一次回验
      </Button>
    );
  }

  return (
    <div className="aether-card p-4 w-full">
      <div className="text-sm font-display gold-text mb-2">模拟回验 (用于演示权重学习)</div>
      <div className="flex flex-wrap gap-2 mb-2">
        <Button size="sm" variant={hit ? "default" : "outline"} onClick={() => setHit(true)}>命中</Button>
        <Button size="sm" variant={!hit ? "default" : "outline"} onClick={() => setHit(false)}>未中</Button>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">偏差归类 (可多选)</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {BIAS_LIST.map((b) => (
          <button
            key={b.key}
            onClick={() => toggle(b.key)}
            className={`text-[10px] px-2 py-0.5 rounded border ${
              biasTypes.includes(b.key)
                ? "border-primary text-primary bg-primary/10"
                : "border-border/60 text-muted-foreground"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => {
          const today = new Date().toISOString().slice(0, 10);
          onSubmit({
            subjectId: "_",
            date: today,
            hit,
            hitScore: hit ? 80 : 30,
            typeMatched: hit,
            intensityMatched: hit,
            actionWorked: hit,
            noise: [],
            createdAt: new Date().toISOString(),
            biasTypes,
            hitAccuracy: hit ? 80 : 30,
            eventTypeMatch: hit ? 85 : 25,
            timingAccuracy: hit ? 80 : 40,
            actionValidity: hit ? 80 : 40,
            noiseInfluence: biasTypes.includes("SIGNAL_NOISE") ? 70 : 20,
            userActionDistortion: biasTypes.includes("ACTION_CHANGED_OUTCOME") ? 70 : 20,
            missingVariablePenalty: biasTypes.includes("HUMAN_VARIABLE_MISSING") ? 70 : 20,
          });
          setOpen(false);
          setBiasTypes([]);
        }}>提交并学习</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>取消</Button>
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground">
        提示：此为模拟，用于演示权重学习闭环；正式回验请在「回验中心」记录。
      </div>
    </div>
  );
}
