import type { ConceptPrediction } from "@/lib/weblcm/webLcmTypes";

export function WebLcmConceptPredictionPanel({ prediction }: { prediction: ConceptPrediction | null | undefined }) {
  if (!prediction) return <div className="text-xs text-muted-foreground p-3 rounded border border-border/40">尚未进行概念预测。</div>;
  return (
    <div className="space-y-2 text-xs">
      <div className="rounded border border-border/40 p-3">
        <div className="font-semibold">预测原因</div>
        <div className="text-muted-foreground">{prediction.predictionReason} · 置信度 {prediction.confidence.toFixed(2)}</div>
      </div>
      <div className="rounded border border-border/40 p-3">
        <div className="font-semibold mb-1">候选后继概念</div>
        {prediction.predictedConcepts.length === 0 ? <div className="text-muted-foreground">无候选。</div> :
          <ul className="space-y-1">
            {prediction.predictedConcepts.map(c => <li key={c.conceptId}>• {c.title} <span className="text-muted-foreground">[{c.conceptType}]</span> — {c.summary}</li>)}
          </ul>
        }
      </div>
      <div className="text-[10px] text-amber-500">⚠ {prediction.riskNotes.join(" / ")}</div>
    </div>
  );
}
