import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProductVitalityPanel } from "@/components/ProductVitalityPanel";
import { evaluateVitality, DEFAULT_VITALITY, type VitalityScores } from "@/lib/productVitality";
import { VITALITY_FACTORS } from "@/constants/productVitalityFactors";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { SafetyBoundaryBanner } from "@/components/SafetyBoundaryBanner";
import { FeedbackEntryCard } from "@/components/FeedbackEntryCard";
import { getSequenceMode } from "@/lib/realSubjectStore";

export const Route = createFileRoute("/vitality")({ component: VitalityPage });

const PRESETS: { name: string; scores: VitalityScores }[] = [
  { name: "Aether Fate Engine", scores: { pain: 8, frequency: 7, loop: 8, data: 8, identity: 9, monetization: 6, spread: 6, depth: 10, geoFit: 7, ops: 6 } },
  { name: "Aether Track Engine", scores: { pain: 7, frequency: 9, loop: 9, data: 9, identity: 8, monetization: 7, spread: 5, depth: 8, geoFit: 7, ops: 5 } },
  { name: "玄征机器预测 OS",     scores: { pain: 7, frequency: 5, loop: 6, data: 7, identity: 6, monetization: 5, spread: 4, depth: 9, geoFit: 6, ops: 7 } },
  { name: "蓝天机 IP 产品",      scores: { pain: 6, frequency: 4, loop: 5, data: 5, identity: 8, monetization: 6, spread: 8, depth: 7, geoFit: 7, ops: 4 } },
];

function VitalityPage() {
  const [name, setName] = useState(PRESETS[0].name);
  const [scores, setScores] = useState<VitalityScores>(PRESETS[0].scores);
  const result = useMemo(() => evaluateVitality(scores), [scores]);
  const mode = typeof window !== "undefined" ? getSequenceMode() : "DEMO";

  return (
    <>
      <PageHeader
        caption="Product Vitality · 产品活性"
        title="产品有没有生命力"
        subtitle="判断产品是否值得继续推进，或只是「想法很大但现实活性低」。"
      />
      <div className="px-6 md:px-10 pt-6">
        <SafetyBoundaryBanner page="Product Vitality" subjectMode={mode} forceLevel="MEDIUM" />
      </div>
      <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 aether-card p-5 space-y-4">
          <div>
            <div className="text-sm mb-1">产品名</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.name}
                onClick={() => { setName(p.name); setScores(p.scores); }}
                className="text-[11px] px-2 py-1 rounded border border-border/60 hover:border-primary/50 hover:text-primary">
                {p.name}
              </button>
            ))}
            <button onClick={() => setScores(DEFAULT_VITALITY)} className="text-[11px] px-2 py-1 rounded border border-border/60 hover:border-primary/50">重置</button>
          </div>
          <div className="space-y-3">
            {VITALITY_FACTORS.map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-xs">
                  <span>{f.name}{f.isCost && <span className="text-destructive/70 ml-1">(逆)</span>}</span>
                  <span className="font-mono text-muted-foreground">{scores[f.key]}/10</span>
                </div>
                <Slider min={0} max={10} step={1} value={[scores[f.key]]}
                  onValueChange={(x) => setScores({ ...scores, [f.key]: x[0] })} />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <ProductVitalityPanel scores={scores} result={result} />
          <FeedbackEntryCard title={`快速回验 · ${name}`} detailLink="/feedback" />
        </div>
      </div>
    </>
  );
}
