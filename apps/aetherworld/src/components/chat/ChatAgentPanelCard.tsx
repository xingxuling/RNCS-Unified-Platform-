// Chat 结果卡：数列 Agent 面板
import type { ChatAgentInfo } from "@/lib/sequence-agent/sequenceAgentChatBridge";

interface Props {
  info: ChatAgentInfo;
}

const SAFETY_COLOR: Record<string, string> = {
  PASS: "text-emerald-500",
  WARN: "text-amber-500",
  BLOCK: "text-rose-500",
};

export function ChatAgentPanelCard({ info }: Props) {
  if (!info?.triggered) return null;
  return (
    <details className="rounded-md border border-border/50 bg-card/60 text-xs" open>
      <summary className="cursor-pointer px-3 py-2 flex flex-wrap items-center gap-2 hover:bg-accent/20">
        <span className="font-medium">数列 Agent</span>
        <span className="text-muted-foreground">·</span>
        <span>{info.modeLabel}</span>
        <span className="text-muted-foreground">·</span>
        <span>{info.items.length} 位 Agent</span>
        {info.conflictNote && (
          <span className="ml-auto text-amber-500">存在 Agent 分歧</span>
        )}
      </summary>
      <div className="px-3 py-2 space-y-2 border-t border-border/40">
        <ul className="space-y-1.5">
          {info.items.map((it) => (
            <li key={it.agentId} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{it.cnName}</span>
                <span className="text-[10px] text-muted-foreground">({it.agentTypeLabel})</span>
                <span className={`text-[10px] ${SAFETY_COLOR[it.safetyStatus]}`}>
                  {it.safetyStatus}
                </span>
              </div>
              <div className="text-muted-foreground leading-relaxed">{it.output}</div>
            </li>
          ))}
        </ul>

        <div className="rounded bg-muted/30 px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            Coordinator 结论
          </div>
          <div>{info.coordinatorConclusion}</div>
          {info.conflictNote && (
            <div className="mt-1 text-amber-500">{info.conflictNote}</div>
          )}
        </div>

        {info.nextSteps.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              下一步建议
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {info.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {info.schedulerSuggestions.length > 0 && (
          <div className="text-[10px] text-muted-foreground">
            调度建议：
            {info.schedulerSuggestions.map((s) => (
              <span key={s.agent} className="mr-2">
                {s.agent}→{s.taskType}{s.needsConfirmation ? "（待确认）" : ""}
              </span>
            ))}
          </div>
        )}

        {info.mslLines.length > 0 && (
          <details className="text-[10px] text-muted-foreground">
            <summary className="cursor-pointer">MSL 状态帧 ({info.mslLines.length})</summary>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[10px]">
              {info.mslLines.join("\n")}
            </pre>
          </details>
        )}
      </div>
    </details>
  );
}
