import type { ConstantGapResult } from "@/lib/constantGapDetector";

export function ConstantGapMatrix({ data }: { data: ConstantGapResult }) {
  return (
    <section className="aether-card-elevated p-5 space-y-3">
      <h3 className="font-display text-base gold-text">数字常数缺口矩阵</h3>
      <div className="text-xs text-muted-foreground">
        关键缺口：<span className="text-foreground">{data.keyGap}</span> — {data.gapExplanation}
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {data.matrix.map((m) => (
          <div key={m.number}
            className={`rounded border px-2 py-2 text-center text-xs ${
              m.status === "缺" ? "border-destructive/60 text-destructive bg-destructive/5" :
              m.status === "过载" ? "border-amber-500/60 text-amber-500 bg-amber-500/5" :
              "border-border text-muted-foreground"
            }`}
            title={m.note}
          >
            <div className="text-base font-display">{m.number}</div>
            <div className="text-[10px]">{m.status}</div>
          </div>
        ))}
      </div>
      <div className="text-xs">
        <div className="text-muted-foreground mb-1">推荐补法</div>
        <ul className="list-disc list-inside space-y-0.5">
          {data.recommended补法.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
    </section>
  );
}
