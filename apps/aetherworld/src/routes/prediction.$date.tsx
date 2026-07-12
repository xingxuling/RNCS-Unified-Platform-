import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAetherData } from "@/lib/useAetherData";
import { computeTrigger } from "@/lib/predictionEngine";
import { PredictionCard } from "@/components/PredictionCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { NOISE_SOURCES } from "@/constants/noise";
import { toast } from "sonner";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { deriveFromTrigger, determine } from "@/lib/determinantNumber";
import { DeterminationCard } from "@/components/DeterminationCard";
import { ContextualManualHint } from "@/components/ContextualManualHint";
import { SafetyBoundaryBanner } from "@/components/SafetyBoundaryBanner";
import { AccuracyDisclaimer } from "@/components/AccuracyDisclaimer";
import { FeedbackEntryCard } from "@/components/FeedbackEntryCard";
import { DemoRealIsolationBadge } from "@/components/DemoRealIsolationBadge";
import { getSequenceMode } from "@/lib/realSubjectStore";
import { computeDimensionRanking } from "@/lib/predictionDimensionEngine";
import { selectEvents } from "@/lib/eventAlgorithmEngine";
import { evaluateStage } from "@/lib/eventStageEngine";
import { getEventManifestation } from "@/lib/eventManifestationEngine";
import { PredictionDimensionPanel } from "@/components/PredictionDimensionPanel";
import { EventAlgorithmCard } from "@/components/EventAlgorithmCard";
import { EventStageTimeline } from "@/components/EventStageTimeline";
import { EventManifestationList } from "@/components/EventManifestationList";
import { EventPriorityMatrix } from "@/components/EventPriorityMatrix";
import { EventValidationChecklist } from "@/components/EventValidationChecklist";

export const Route = createFileRoute("/prediction/$date")({ component: PredictionDetail });

function PredictionDetail() {
  const { date } = Route.useParams();
  const { active, feedback, upsertFeedback, removeFeedback } = useAetherData();

  const existing = feedback.find((f) => f.date === date);

  const [hit, setHit] = useState<boolean>(existing?.hit ?? true);
  const [hitScore, setHitScore] = useState<number>(existing?.hitScore ?? 60);
  const [typeMatched, setTypeMatched] = useState(existing?.typeMatched ?? true);
  const [intensityMatched, setIntensityMatched] = useState(existing?.intensityMatched ?? true);
  const [actionWorked, setActionWorked] = useState(existing?.actionWorked ?? true);
  const [noise, setNoise] = useState<string[]>(existing?.noise ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const result = useMemo(() => {
    if (!active) return null;
    const hints = feedback.map((f) => ({ date: f.date, hitScore: f.hitScore }));
    return computeTrigger(active, date, { feedbackHints: hints });
  }, [active, date, feedback]);

  const determination = useMemo(() => {
    if (!result) return null;
    return determine(deriveFromTrigger(result, feedback));
  }, [result, feedback]);

  const dimensionRanking = useMemo(() => {
    if (!active || !result) return null;
    return computeDimensionRanking({
      subject: active, trigger: result, focusHint: active.focuses ?? [],
    });
  }, [active, result]);

  const eventSelection = useMemo(() => {
    if (!result || !dimensionRanking || !determination) return null;
    return selectEvents({
      trigger: result,
      dimensionPrimary: dimensionRanking.primary,
      dimensionSecondary: dimensionRanking.secondary,
      determinationScore: determination.determinationScore ?? 50,
    });
  }, [result, dimensionRanking, determination]);

  const stageEvaluation = useMemo(() => {
    if (!result || !eventSelection) return null;
    return evaluateStage({
      trigger: result,
      polarity: eventSelection.primary.event.positiveOrNegative,
      determinationScore: determination?.determinationScore ?? 50,
    });
  }, [result, eventSelection, determination]);

  const manifestation = useMemo(() => {
    if (!eventSelection || !stageEvaluation) return null;
    return getEventManifestation(eventSelection.primary.event.id, stageEvaluation.current.id);
  }, [eventSelection, stageEvaluation]);

  if (!active || !result || !determination) return null;

  const save = () => {
    upsertFeedback({
      subjectId: active.id,
      date,
      hit, hitScore, typeMatched, intensityMatched, actionWorked,
      noise, notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    toast.success("已记录结果，模型已更新");
  };

  return (
    <>
      <PageHeader
        caption="Prediction Detail · 预测详情"
        title={date}
        subtitle={`你的个人模型「${active.codeName ?? active.name}」· ${active.stage}`}
        actions={
          <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" /> 返回日历
          </Link>
        }
      />

      <div className="p-6 md:p-10 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DemoRealIsolationBadge mode={typeof window !== "undefined" ? getSequenceMode() : "DEMO"} withDescription />
          </div>
          <ContextualManualHint
            currentPage="Prediction Detail"
            subjectMode={typeof window !== "undefined" ? getSequenceMode() : "DEMO"}
            userStage="VIEWING_PREDICTION"
            determinationLocked={determination.status === "DETERMINED" || determination.status === "NEAR_DETERMINED"}
          />
          <SafetyBoundaryBanner
            page="Prediction Detail"
            subjectMode={typeof window !== "undefined" ? getSequenceMode() : "DEMO"}
            determinationLocked={determination.status === "DETERMINED" || determination.status === "NEAR_DETERMINED"}
          />
          <AccuracyDisclaimer compact hasEnoughSamples={feedback.length >= 100} />
          <FeedbackEntryCard
            date={date}
            alreadyLogged={!!existing}
            title="顶部快速记录 · 把今天发生的写下来"
          />
          <DeterminationCard result={determination} caption="判断这件事定没定" title={`${date} · 今天这件事，定没定？`} />
          <PredictionCard result={result} mainline={active.stage} href={false} />

          {dimensionRanking && <PredictionDimensionPanel ranking={dimensionRanking} />}

          {eventSelection && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EventAlgorithmCard candidate={eventSelection.primary} kind="primary" />
              {eventSelection.secondary[0] && (
                <EventAlgorithmCard candidate={eventSelection.secondary[0]} kind="secondary" />
              )}
              {eventSelection.risk && (
                <EventAlgorithmCard candidate={eventSelection.risk} kind="risk" />
              )}
              {eventSelection.secondary[1] && (
                <EventAlgorithmCard candidate={eventSelection.secondary[1]} kind="secondary" />
              )}
            </div>
          )}

          {stageEvaluation && <EventStageTimeline evaluation={stageEvaluation} />}
          {manifestation && <EventManifestationList view={manifestation} />}
          {eventSelection && <EventPriorityMatrix selection={eventSelection} />}
          {eventSelection && (
            <EventValidationChecklist eventId={eventSelection.primary.event.id} />
          )}


          {/* 计算解释 */}
          <div className="mt-6 aether-card p-5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Score Breakdown · 触发分构成
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
              {Object.entries(result.breakdown).map(([k, v]) => (
                <div key={k} className="rounded-md border border-border/60 bg-secondary/20 p-3">
                  <div className="text-[10px] text-muted-foreground uppercase">{k}</div>
                  <div className="font-mono mt-1">{v}</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
              当前为 v0.1 结构预测引擎。Phase A 基础数字常数已实装，Phase B 结构常数（河图洛数 / 干支 / 十神 / 九宫）与 Phase C 物理常数（太阳 / 月相 / 节律 / 共振）以模块边界形式预留。
            </div>
          </div>
        </div>

        {/* 记录面板 */}
        <div className="aether-card-elevated p-6 h-fit xl:sticky xl:top-32">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            记录后来发生了什么
          </div>
          <h2 className="font-display text-xl gold-text mt-1">记录结果</h2>
          <p className="text-xs text-muted-foreground mt-1">
            把实际发生的情况写下来，系统会用它持续修正你的个人模型。
          </p>

          <div className="space-y-4 mt-5">
            <div>
              <Label className="text-xs">是否命中</Label>
              <div className="flex gap-2 mt-1">
                {[true, false].map((v) => (
                  <button
                    key={v.toString()}
                    onClick={() => setHit(v)}
                    className={`px-3 py-1.5 text-xs rounded border transition ${
                      hit === v ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary/30 text-muted-foreground"
                    }`}
                  >
                    {v ? "命中" : "未命中"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">命中程度：<span className="font-mono text-primary">{hitScore}</span></Label>
              <Slider value={[hitScore]} max={100} step={1} onValueChange={(v) => setHitScore(v[0])} className="mt-2" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <ToggleChip on={typeMatched} onClick={() => setTypeMatched(!typeMatched)} label="事件类型对" />
              <ToggleChip on={intensityMatched} onClick={() => setIntensityMatched(!intensityMatched)} label="强度对" />
              <ToggleChip on={actionWorked} onClick={() => setActionWorked(!actionWorked)} label="行动有效" />
            </div>

            <div>
              <Label className="text-xs">偏差原因</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {NOISE_SOURCES.map((n) => {
                  const on = noise.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => setNoise(on ? noise.filter((x) => x !== n) : [...noise, n])}
                      className={`text-[11px] px-2 py-1 rounded border transition ${
                        on ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs">备注</Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="实际发生了什么？谁参与？关键节点何时出现？"
                className="mt-1 text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={save} className="flex-1">
                <CheckCircle2 className="w-4 h-4 mr-1" /> 保存记录
              </Button>
              {existing && (
                <Button variant="ghost" className="text-destructive" onClick={() => { removeFeedback(date); toast.success("已删除记录"); }}>
                  删除
                </Button>
              )}
            </div>

            {existing && (
              <div className="text-[10px] text-muted-foreground text-center pt-1">
                上次更新：{new Date(existing.createdAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ToggleChip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2 py-2 rounded border transition ${
        on ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-border bg-secondary/30 text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}
