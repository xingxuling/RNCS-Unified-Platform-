import type { AetherConceptChain } from "@/lib/weblcm/webLcmTypes";

export function WebLcmConceptChainPanel({ chain }: { chain: AetherConceptChain | null }) {
  if (!chain) return <div className="text-xs text-muted-foreground p-3 rounded border border-border/40">尚未构建概念链。</div>;
  return (
    <div className="space-y-3 text-xs">
      <div className="rounded border border-border/40 p-3 space-y-1">
        <div className="font-semibold">{chain.title}</div>
        <div className="text-muted-foreground">类型：{chain.chainType} · QA：{chain.qaStatus}</div>
        <div>{chain.compressionSummary}</div>
      </div>
      <div className="rounded border border-border/40 p-3 space-y-1">
        <div className="font-semibold mb-1">概念顺序</div>
        <ol className="list-decimal list-inside space-y-1">
          {chain.orderedConcepts.map(c => (
            <li key={c.conceptId}><span className="text-muted-foreground">[{c.abstractionLevel}]</span> {c.title}</li>
          ))}
        </ol>
      </div>
      {chain.predictedNextConcepts.length > 0 && (
        <div className="rounded border border-border/40 p-3 space-y-1">
          <div className="font-semibold mb-1">预测后继概念</div>
          <ul className="list-disc list-inside space-y-1">
            {chain.predictedNextConcepts.map(c => <li key={c.conceptId}>{c.title} <span className="text-muted-foreground">({c.conceptType})</span></li>)}
          </ul>
        </div>
      )}
      {chain.expansionPrompt && (
        <details className="rounded border border-border/40 p-3">
          <summary className="cursor-pointer font-semibold">WebLLM 展开 Prompt</summary>
          <pre className="text-[10px] whitespace-pre-wrap mt-2 text-muted-foreground">{chain.expansionPrompt}</pre>
        </details>
      )}
    </div>
  );
}
