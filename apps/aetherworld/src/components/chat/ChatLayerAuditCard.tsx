// 分层审计 · 结果卡
import type { ChatLayerAuditInfo } from "@/lib/layer-audit/layerAuditChatBridge";

interface Props {
  info: ChatLayerAuditInfo;
}

const ASPECT_LABEL: Record<string, string> = {
  SKELETON: "骨架",
  MUSCLE: "肌肉",
  BLOOD: "血液",
  NERVE: "神经",
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: "border-rose-500/40 text-rose-500",
  P1: "border-amber-500/40 text-amber-500",
  P2: "border-sky-500/40 text-sky-500",
  P3: "border-border/60 text-muted-foreground",
};

export function ChatLayerAuditCard({ info }: Props) {
  const { report } = info;
  const topP0 = report.p0CompletionPlan.slice(0, 5);
  const topP1 = report.p1CompletionPlan.slice(0, 3);

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          分层审计 · L0-L10
        </div>
        <a
          href="/system/layer-audit"
          className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
        >
          打开分层审计
        </a>
      </div>

      <div className="text-sm text-foreground/90">{info.summary}</div>

      {info.weakest && (
        <div className="rounded-md border border-border/40 bg-muted/10 p-2 text-xs flex items-center justify-between gap-2">
          <span className="text-muted-foreground">最薄弱层</span>
          <span className="text-foreground/90">
            {info.weakest.layerId} · {info.weakest.layerName}
          </span>
          <span className="text-foreground/80">{info.weakest.maturityScore}/100</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5 text-[10px]">
        {(["SKELETON", "MUSCLE", "BLOOD", "NERVE"] as const).map((asp) => {
          const count =
            asp === "SKELETON" ? report.globalMissingSkeleton.length :
            asp === "MUSCLE"   ? report.globalMissingMuscle.length   :
            asp === "BLOOD"    ? report.globalMissingBlood.length    :
                                 report.globalMissingNerve.length;
          return (
            <div key={asp} className="rounded-md border border-border/40 bg-muted/10 p-1.5 text-center">
              <div className="text-muted-foreground">{ASPECT_LABEL[asp]}</div>
              <div className="text-foreground/90 text-sm">{count}</div>
            </div>
          );
        })}
      </div>

      {topP0.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-muted-foreground">P0 补齐动作</div>
          {topP0.map((a) => (
            <div key={a.id} className="rounded-md border border-border/40 bg-muted/10 p-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-foreground/90">{a.title}</div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${PRIORITY_COLOR[a.priority]}`}
                >
                  {a.priority} · {ASPECT_LABEL[a.aspect]}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">{a.description}</div>
            </div>
          ))}
        </div>
      )}

      {topP1.length > 0 && (
        <details className="text-[11px] text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">P1 补齐动作（{report.p1CompletionPlan.length}）</summary>
          <ul className="mt-1.5 space-y-1 pl-4 list-disc">
            {topP1.map((a) => (
              <li key={a.id}>
                <span className="text-foreground/80">{a.title}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
