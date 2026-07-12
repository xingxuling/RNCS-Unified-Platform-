import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultQaBadge } from "./ChatResultQaBadge";
import { ChatResultActionBar } from "./ChatResultActionBar";

interface Props {
  result: ChatDisplayResult;
  onAction?: (action: ChatResultAction, result: ChatDisplayResult) => void;
  /** 卡片左侧色彩主题色 */
  accent?: "primary" | "emerald" | "amber" | "rose" | "sky" | "violet" | "muted";
  /** 中部领域专属预览（如歌词、文件树、Tick 摘要等） */
  children?: React.ReactNode;
}

const ACCENT_CLASS = {
  primary: "border-l-primary/60",
  emerald: "border-l-emerald-500/60",
  amber:   "border-l-amber-500/60",
  rose:    "border-l-rose-500/60",
  sky:     "border-l-sky-500/60",
  violet:  "border-l-violet-500/60",
  muted:   "border-l-border",
} as const;

/**
 * 所有 ChatDisplayResult 卡片的通用容器。
 * - 顶部：标题 + 来源标签 + QA 徽章
 * - 中部：summary（始终显示）+ 可选 children 详细预览（桌面端）
 * - 底部：操作按钮
 *
 * 移动端：children 自动隐藏，只保留摘要与一个主按钮（在 ActionBar 内）。
 */
export function ChatResultBaseCard({ result, onAction, accent = "primary", children }: Props) {
  return (
    <div
      className={`rounded-xl border border-border/50 ${ACCENT_CLASS[accent]} border-l-2 bg-card/60 p-3 space-y-2`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {result.sourceModule}
          </div>
          <h3 className="text-sm font-display truncate">{result.title}</h3>
        </div>
        <ChatResultQaBadge status={result.qaStatus} />
      </div>

      <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>

      {children && (
        <div className="hidden sm:block">
          {children}
        </div>
      )}

      <ChatResultActionBar result={result} onAction={onAction} />
    </div>
  );
}
