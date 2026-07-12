// Chat 结果卡：数列 AI
import type { ChatSequenceAiInfo } from "@/lib/sequence-ai/sequenceAiChatBridge";

interface Props {
  info: ChatSequenceAiInfo;
}

const SAFETY_COLOR: Record<string, string> = {
  PASS: "text-emerald-500",
  WARN: "text-amber-500",
  BLOCK: "text-rose-500",
};

const STEP_COLOR: Record<string, string> = {
  SUCCESS: "text-emerald-500",
  PENDING: "text-amber-500",
  RUNNING: "text-blue-500",
  FAILED: "text-rose-500",
  SKIPPED: "text-muted-foreground",
};

export function ChatSequenceAiCard({ info }: Props) {
  if (!info?.triggered) return null;
  const r = info.result;
  return (
    <details className="rounded-md border border-border/50 bg-card/60 text-xs" open>
      <summary className="cursor-pointer px-3 py-2 flex flex-wrap items-center gap-2 hover:bg-accent/20">
        <span className="font-medium">数列 AI 结果</span>
        <span className="text-muted-foreground">·</span>
        <span>{r.modeLabel}</span>
        <span className="text-muted-foreground">·</span>
        <span>{r.plan.steps.length} 步</span>
        <span className={`ml-auto ${SAFETY_COLOR[r.plan.safetyStatus]}`}>
          安全：{r.plan.safetyStatus}
        </span>
      </summary>
      <div className="px-3 py-2 space-y-2 border-t border-border/40">
        <div className="rounded bg-muted/30 px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            结论
          </div>
          <div>{r.summary.conclusion}</div>
          {r.summary.sequenceCode && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              sequenceCode：<span className="font-mono">{r.summary.sequenceCode}</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            执行计划
          </div>
          <ol className="space-y-0.5">
            {r.plan.steps.map((s) => (
              <li key={s.id} className="flex gap-1.5">
                <span className={`font-mono text-[10px] ${STEP_COLOR[s.status]}`}>
                  [{s.status}]
                </span>
                <span className="font-medium">{s.cnName}</span>
                <span className="text-muted-foreground">— {s.action}</span>
                {s.note && <span className="text-amber-500 text-[10px]">（{s.note}）</span>}
              </li>
            ))}
          </ol>
        </div>

        {r.summary.keyPoints.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              关键要点
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {r.summary.keyPoints.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {r.summary.nextActions.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              下一步
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {r.summary.nextActions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {r.summary.riskNotes.length > 0 && (
          <div className="text-amber-500 text-[10px]">
            {r.summary.riskNotes.map((n, i) => <div key={i}>· {n}</div>)}
          </div>
        )}

        <div className="flex gap-3 text-[10px] text-muted-foreground border-t border-border/30 pt-1">
          <span>价值事件：{r.summary.valueEventCount}</span>
          <span>记忆单元：{r.summary.memoryUnitEstimate}</span>
          <span>最终输出：{r.plan.finalOutputType}</span>
        </div>

        {r.summary.mslLines.length > 0 && (
          <details className="text-[10px] text-muted-foreground">
            <summary className="cursor-pointer">MSL 状态帧</summary>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[10px]">
              {r.summary.mslLines.join("\n")}
            </pre>
          </details>
        )}
      </div>
    </details>
  );
}
