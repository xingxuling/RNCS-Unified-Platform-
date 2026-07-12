// AetherSeed First Run · Chat 卡片
import type { ChatFirstRunInfo } from "@/lib/aetherseed-first-run/firstRunChatBridge";

export function ChatFirstRunCard({ info }: { info: ChatFirstRunInfo }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-card/50 p-3 text-xs">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">第一炉训练准备 · {info.focusLabel}</span>
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-foreground/80">
          {info.levelLabel} · {info.score}/100
        </span>
      </div>
      <p className="text-muted-foreground">{info.summary}</p>

      <div className="mt-2 rounded bg-muted/40 p-2 text-[11px]">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">第一炉建议</div>
        <div className="mt-1 font-medium text-foreground">{info.topModel.name}</div>
        <div className="text-foreground/80">{info.topModel.reason}</div>
        <div className="mt-1 text-muted-foreground">建议样本上限 ≤ {info.topModel.sampleCap} 条</div>
      </div>

      {info.blockingReasons.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">阻断原因</div>
          <ul className="space-y-0.5 text-[11px] text-foreground/80">
            {info.blockingReasons.slice(0, 4).map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </div>
      )}

      {info.remainingSteps.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">距离点火还差</div>
          <ul className="space-y-0.5 text-[11px] text-foreground/80">
            {info.remainingSteps.slice(0, 4).map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </div>
      )}

      {info.finalChecklist.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>点火前最后清单</span>
            <span className={info.canIgnite ? "text-emerald-300" : "text-amber-300"}>
              {info.canIgnite ? "全部通过" : "尚未完成"}
            </span>
          </div>
          <ul className="space-y-0.5 text-[11px]">
            {info.finalChecklist.slice(0, 6).map((c, i) => (
              <li key={i} className={c.ok ? "text-foreground/80" : "text-rose-200"}>
                {c.ok ? "✓" : "·"} {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 text-[10px] text-muted-foreground">{info.workbenchHint}</div>
    </div>
  );
}
