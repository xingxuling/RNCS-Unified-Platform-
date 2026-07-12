// AetherSeed Auto Training Executor · Chat 卡片
import type { ChatAutoTrainingInfo } from "@/lib/aetherseed-auto-training/autoTrainingChatBridge";

export function ChatAutoTrainingCard({ info }: { info: ChatAutoTrainingInfo }) {
  const t = info.latestTask;
  return (
    <div className="mt-3 rounded-md border border-border bg-card/40 p-3 text-xs text-foreground">
      <div className="flex items-center justify-between">
        <div className="font-medium">自动训练执行器 · {info.focusLabel}</div>
        <div className="text-muted-foreground">{info.bridge.kind === "NONE" ? "NEEDS_LOCAL_GATEWAY" : info.bridge.kind}</div>
      </div>
      <p className="mt-2 text-muted-foreground">{info.summary}</p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <Stat label="任务总数" value={info.snapshot.total} />
        <Stat label="等待确认" value={info.snapshot.waitingConfirmation} />
        <Stat label="运行中" value={info.snapshot.running} />
        <Stat label="完成" value={info.snapshot.completed} />
        <Stat label="失败" value={info.snapshot.failed} />
        <Stat label="拦截" value={info.snapshot.blocked} />
      </div>

      {t && (
        <div className="mt-3 rounded border border-border/60 p-2">
          <div className="font-medium">{t.name}</div>
          <div className="mt-1 text-muted-foreground">
            状态：{t.status} · 安全：{t.safetyStatus}
            {t.environmentStatus ? ` · 环境：${t.environmentStatus}` : ""}
            {typeof t.canRun === "boolean" ? ` · 可运行：${t.canRun ? "是" : "否"}` : ""}
          </div>
          {t.commandPreview.length > 0 && (
            <pre className="mt-2 overflow-x-auto rounded bg-background/50 p-2 text-[11px]">
              {t.commandPreview.join("\n")}
            </pre>
          )}
          {t.blockedReasons.length > 0 && (
            <div className="mt-2 text-rose-300">拦截：{t.blockedReasons.join("；")}</div>
          )}
        </div>
      )}

      <div className="mt-3 text-[11px] text-muted-foreground">{info.workbenchHint}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border/60 px-2 py-1">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
