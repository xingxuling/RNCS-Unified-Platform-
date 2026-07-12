import type { ChatAskToDoCardData } from "@/lib/chat/chatMessageEngine";

interface Props {
  data: ChatAskToDoCardData;
  onAction?: (route?: string) => void;
}

const FEASIBILITY_LABEL: Record<ChatAskToDoCardData["feasibility"], { text: string; color: string }> = {
  FEASIBLE:    { text: "可行",       color: "text-emerald-400 border-emerald-500/40" },
  PARTIAL:     { text: "部分可行",   color: "text-amber-400 border-amber-500/40" },
  INFEASIBLE:  { text: "暂不可行",   color: "text-rose-400 border-rose-500/40" },
  NEEDS_INFO:  { text: "需更多信息", color: "text-muted-foreground border-border/50" },
};

export function ChatAskToDoCard({ data, onAction }: Props) {
  const fe = FEASIBILITY_LABEL[data.feasibility];
  return (
    <div className="rounded-xl border border-border/50 bg-card/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">推荐方案</div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${fe.color}`}>{fe.text}</span>
      </div>
      <div className="text-sm text-foreground/90">{data.summary}</div>

      {data.requiredCapabilities && data.requiredCapabilities.length > 0 && (
        <div className="text-[11px] text-muted-foreground space-y-1">
          <div>需要能力：</div>
          <ul className="space-y-0.5">
            {data.requiredCapabilities.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="text-foreground/80">{c.id}</span>
                <span className={c.enabled ? "text-emerald-400" : c.installed ? "text-amber-400" : "text-muted-foreground"}>
                  {c.enabled ? "已启用" : c.installed ? "已安装未启用" : "未安装"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendedPath.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-muted-foreground">下一步：</div>
          <div className="flex flex-wrap gap-1.5">
            {data.recommendedPath.map((p, i) => (
              <button
                key={i}
                onClick={() => p.route && onAction?.(p.route)}
                className="text-xs px-2.5 py-1 rounded-md border border-border/60 hover:bg-muted/40"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
