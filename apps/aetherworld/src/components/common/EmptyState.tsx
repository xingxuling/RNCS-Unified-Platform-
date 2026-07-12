import { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  /** 主操作按钮文字 */
  actionLabel?: string;
  onAction?: () => void;
  /** 次级提示，例如「也可以从对话中创建」 */
  secondary?: ReactNode;
  className?: string;
}

/**
 * 通用空状态。
 * 设计原则：先告诉用户「这里现在没有东西」，再告诉他「下一步可以做什么」。
 */
export function EmptyState({
  icon,
  title = "暂无内容",
  description,
  actionLabel,
  onAction,
  secondary,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 rounded-xl border border-dashed border-border/60 bg-background/40 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground mb-3">
        {icon ?? <Inbox className="w-5 h-5" />}
      </div>
      <div className="text-sm font-display text-foreground">{title}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-[12px] rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5"
        >
          {actionLabel}
        </button>
      )}
      {secondary && <div className="mt-3 text-[11px] text-muted-foreground">{secondary}</div>}
    </div>
  );
}
