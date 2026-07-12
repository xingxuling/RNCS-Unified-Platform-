import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GeoAnalysisPanel } from "@/components/GeoAnalysisPanel";
import { evaluateGeo } from "@/lib/geoFactor";
import { GEO_PRESETS } from "@/constants/geoFactors";
import { PROMPT_STAGES, type PromptStage } from "@/constants/promptTypes";
import { SafetyBoundaryBanner } from "@/components/SafetyBoundaryBanner";
import { FeedbackEntryCard } from "@/components/FeedbackEntryCard";
import { getSequenceMode } from "@/lib/realSubjectStore";

export const Route = createFileRoute("/geo")({ component: GeoPage });

function GeoPage() {
  const [key, setKey] = useState(GEO_PRESETS[0].key);
  const [stage, setStage] = useState<PromptStage>("Internal Test");
  const result = useMemo(() => evaluateGeo(key, stage), [key, stage]);
  const mode = typeof window !== "undefined" ? getSequenceMode() : "DEMO";

  return (
    <>
      <PageHeader
        caption="Geo Analysis · 地理因素"
        title="地理 / 制度 / 市场 适配"
        subtitle="同一产品在不同地点的承载力不同；本页给出每个备选地点的适配评分与行动建议。"
      />
      <div className="px-6 md:px-10 pt-6">
        <SafetyBoundaryBanner page="Geo Analysis" subjectMode={mode} forceLevel="MEDIUM" />
      </div>
      <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="aether-card p-5 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">地点</div>
            <div className="space-y-1">
              {GEO_PRESETS.map((g) => (
                <button key={g.key}
                  onClick={() => setKey(g.key)}
                  className={`w-full text-left px-3 py-2 rounded-md border transition text-sm ${
                    key === g.key ? "border-primary/60 bg-primary/5" : "border-border/60 hover:border-primary/30"
                  }`}>
                  <div>{g.name}</div>
                  <div className="text-[10px] text-muted-foreground tracking-wider">{g.en}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">阶段</div>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_STAGES.map((s) => (
                <button key={s} onClick={() => setStage(s)}
                  className={`text-[11px] px-2 py-1 rounded border ${stage === s ? "border-primary/60 text-primary" : "border-border/60"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 space-y-4">
          <GeoAnalysisPanel result={result} />
          <FeedbackEntryCard title="快速回验 · 地区适配" detailLink="/feedback" />
        </div>
      </div>
    </>
  );
}
