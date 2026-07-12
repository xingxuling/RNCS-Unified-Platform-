import type { ValidationPath } from "@/lib/validationPathGenerator";

export function ValidationPathChecklist({ data }: { data: ValidationPath }) {
  const Row = ({ title, items, tone }: { title: string; items: string[]; tone: string }) => (
    <div>
      <div className={`text-[11px] uppercase tracking-[0.25em] ${tone}`}>{title}</div>
      <ul className="list-disc list-inside text-sm space-y-0.5 mt-1">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
  return (
    <section className="aether-card-elevated p-5 space-y-3">
      <h3 className="font-display text-base gold-text">验证路径 · Validation Path</h3>
      <Row title="成功信号" items={data.successSignals} tone="text-emerald-500" />
      <Row title="部分成功信号" items={data.partialSuccessSignals} tone="text-amber-500" />
      <Row title="失败信号" items={data.failureSignals} tone="text-destructive" />
      <Row title="伪正向信号" items={data.falsePositiveSignals} tone="text-muted-foreground" />
      <div className="border-t border-border/60 pt-2 text-xs">
        <div className="text-muted-foreground mb-1">回访问题</div>
        <ul className="list-disc list-inside space-y-0.5">
          {data.feedbackQuestions.map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      </div>
      <div className="text-[11px] text-muted-foreground">下一轮重算触发：{data.nextRecalculationTrigger}</div>
    </section>
  );
}
