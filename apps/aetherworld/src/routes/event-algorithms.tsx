import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAetherData } from "@/lib/useAetherData";
import { computeTrigger } from "@/lib/predictionEngine";
import { computeDimensionRanking } from "@/lib/predictionDimensionEngine";
import { selectEvents } from "@/lib/eventAlgorithmEngine";
import { evaluateStage } from "@/lib/eventStageEngine";
import { getEventManifestation } from "@/lib/eventManifestationEngine";
import { EventAlgorithmCard } from "@/components/EventAlgorithmCard";
import { EventPriorityMatrix } from "@/components/EventPriorityMatrix";
import { EventStageTimeline } from "@/components/EventStageTimeline";
import { EventManifestationList } from "@/components/EventManifestationList";
import { EventValidationChecklist } from "@/components/EventValidationChecklist";
import { EventAlgorithmPromptGenerator } from "@/components/EventAlgorithmPromptGenerator";
import { PREDICTION_DIMENSIONS, type PredictionDimensionId } from "@/constants/predictionDimensions";
import { EVENT_STAGES, type EventStageId } from "@/constants/eventStages";

export const Route = createFileRoute("/event-algorithms")({ component: EventAlgorithmsPage });

function EventAlgorithmsPage() {
  const { active } = useAetherData();
  const [dimFilter, setDimFilter] = useState<PredictionDimensionId | "">("");
  const [stageFilter, setStageFilter] = useState<EventStageId | "">("");

  const today = new Date().toISOString().slice(0, 10);
  const data = useMemo(() => {
    if (!active) return null;
    const trigger = computeTrigger(active, today);
    const ranking = computeDimensionRanking({
      subject: active,
      trigger,
      focusHint: active.focuses ?? [],
    });
    const selection = selectEvents({
      trigger,
      dimensionPrimary: ranking.primary,
      dimensionSecondary: ranking.secondary,
    });
    const stage = evaluateStage({ trigger, polarity: selection.primary.event.positiveOrNegative });
    const manifestation = getEventManifestation(selection.primary.event.id, stage.current.id);
    return { trigger, ranking, selection, stage, manifestation };
  }, [active, today]);

  const filteredAll = useMemo(() => {
    if (!data) return [];
    return data.selection.all.filter((c) => {
      if (dimFilter && c.event.dimensionId !== dimFilter) return false;
      return true;
    });
  }, [data, dimFilter]);

  return (
    <>
      <PageHeader
        caption="Event Algorithm Engine · 事件算法引擎"
        title="事件算法"
        subtitle="把抽象触发转化为可识别的事件：主事件、副事件、风险事件、阶段、表现、回验。"
      />
      <div className="p-6 md:p-10 space-y-6">
        {!data ? (
          <div className="aether-card p-6 text-sm text-muted-foreground">请先选择或导入主体后查看事件算法解码。</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <EventAlgorithmCard candidate={data.selection.primary} kind="primary" />
              {data.selection.secondary.map((c) => (
                <EventAlgorithmCard key={c.event.id} candidate={c} kind="secondary" />
              ))}
              {data.selection.risk && data.selection.secondary.length < 2 && (
                <EventAlgorithmCard candidate={data.selection.risk} kind="risk" />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <EventStageTimeline evaluation={data.stage} />
              <EventManifestationList view={data.manifestation} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <EventPriorityMatrix selection={data.selection} />
              <EventValidationChecklist eventId={data.selection.primary.event.id} />
            </div>

            <div className="aether-card p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Event Browser · 事件总览
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={dimFilter}
                    onChange={(e) => setDimFilter(e.target.value as PredictionDimensionId | "")}
                    className="bg-background border border-border rounded px-2 py-1"
                  >
                    <option value="">全部维度</option>
                    {PREDICTION_DIMENSIONS.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as EventStageId | "")}
                    className="bg-background border border-border rounded px-2 py-1"
                  >
                    <option value="">全部阶段</option>
                    {EVENT_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredAll.slice(0, 12).map((c) => (
                  <div key={c.event.id} className="rounded-md border border-border bg-secondary/15 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{c.event.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{c.score}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{c.event.en} · {c.event.dimensionId}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{c.event.actionPermissions.join(" / ")}</div>
                  </div>
                ))}
              </div>
            </div>

            <EventAlgorithmPromptGenerator />
          </>
        )}
      </div>
    </>
  );
}
