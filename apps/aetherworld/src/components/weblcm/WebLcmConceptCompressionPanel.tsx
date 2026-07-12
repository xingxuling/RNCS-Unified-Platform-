import type { ConceptCompressionResult } from "@/lib/weblcm/webLcmTypes";

export function WebLcmConceptCompressionPanel({ compression }: { compression: ConceptCompressionResult | null }) {
  if (!compression) return <div className="text-xs text-muted-foreground p-3 rounded border border-border/40">尚未进行概念压缩。</div>;
  return (
    <div className="space-y-2 text-xs">
      <div className="rounded border border-border/40 p-3">
        <div className="font-semibold mb-1">压缩摘要 ({compression.coreConcepts.length} 个核心概念)</div>
        <pre className="whitespace-pre-wrap text-muted-foreground">{compression.compressionSummary || "（空）"}</pre>
      </div>
      {compression.lostDetails.length > 0 && (
        <div className="rounded border border-border/40 p-3">
          <div className="font-semibold mb-1">未保留的细节 ({compression.lostDetails.length})</div>
          <div className="text-muted-foreground">{compression.lostDetails.join("、")}</div>
        </div>
      )}
      <div className="text-[10px] text-amber-500">⚠ {compression.riskNotes.join(" / ")}</div>
    </div>
  );
}
