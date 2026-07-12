import { Card } from "@/components/ui/card";
import type { FreeAnswer } from "@/lib/free-input/freeAnswerComposer";

export function FreeAnswerCard({ answer }: { answer: FreeAnswer }) {
  return (
    <Card className="p-5 space-y-4">
      <header>
        <h3 className="text-lg font-semibold">{answer.title}</h3>
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{answer.answer}</p>
      </header>
      {answer.assumptions.length > 0 && (
        <div className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
          假设：{answer.assumptions.join("；")}
        </div>
      )}
      {answer.reasoningSummary && (
        <div className="text-xs text-muted-foreground">{answer.reasoningSummary}</div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <section>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">下一步</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            {answer.nextActions.map((a, i) => (<li key={i}>{a}</li>))}
          </ol>
        </section>
        <section>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">验证点</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {answer.validationPoints.map((a, i) => (<li key={i}>{a}</li>))}
          </ul>
        </section>
      </div>
      {answer.generatedAssets.length > 0 && (
        <section>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">生成资产</h4>
          <div className="space-y-2">
            {answer.generatedAssets.map((a) => (
              <details key={a.id} className="rounded border border-border/60 bg-muted/30">
                <summary className="px-3 py-2 text-sm cursor-pointer">{a.title}（{a.kind}）</summary>
                <pre className="text-[11px] p-3 overflow-x-auto whitespace-pre-wrap">{a.content}</pre>
              </details>
            ))}
          </div>
        </section>
      )}
    </Card>
  );
}
