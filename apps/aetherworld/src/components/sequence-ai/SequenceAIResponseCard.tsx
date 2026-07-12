import type { SequenceAIResponse } from "@/lib/sequence-ai/sequenceAIResponseComposer";
import { Card } from "@/components/ui/card";

export function SequenceAIResponseCard({ response }: { response: SequenceAIResponse }) {
  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{response.title}</h3>
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{response.plainAnswer}</p>
      </div>

      {response.structuralAnswer && (
        <div className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
          {response.structuralAnswer}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <section>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">下一步动作</h4>
          <ul className="text-sm space-y-1.5 list-disc list-inside">
            {response.nextActions.map((a, i) => (<li key={i}>{a}</li>))}
          </ul>
        </section>
        <section>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">验证点</h4>
          <ul className="text-sm space-y-1.5 list-disc list-inside">
            {response.validationPoints.map((a, i) => (<li key={i}>{a}</li>))}
          </ul>
        </section>
      </div>

      {response.generatedAssets.length > 0 && (
        <section>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">生成资产</h4>
          <div className="space-y-2">
            {response.generatedAssets.map((asset) => (
              <details key={asset.id} className="rounded border border-border/60 bg-muted/30">
                <summary className="px-3 py-2 text-sm cursor-pointer">{asset.title}（{asset.kind}）</summary>
                <pre className="text-[11px] p-3 overflow-x-auto whitespace-pre-wrap">{asset.content}</pre>
              </details>
            ))}
          </div>
        </section>
      )}
    </Card>
  );
}
