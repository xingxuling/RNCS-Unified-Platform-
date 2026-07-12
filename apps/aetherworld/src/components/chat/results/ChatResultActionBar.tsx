import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ChatResultAction, ChatDisplayResult } from "@/lib/chat/chatDisplayResultTypes";

interface Props {
  result: ChatDisplayResult;
  onAction?: (action: ChatResultAction, result: ChatDisplayResult) => void;
}

const STYLE_CLASS = {
  primary:   "border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary",
  secondary: "border-border/50 hover:border-border text-muted-foreground hover:text-foreground",
  danger:    "border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive",
} as const;

export function ChatResultActionBar({ result, onAction }: Props) {
  if (!result.actions || result.actions.length === 0) return null;

  function handle(a: ChatResultAction) {
    if (a.actionType === "COPY" && result.mainContent) {
      navigator.clipboard?.writeText(result.mainContent).then(
        () => toast.success("已复制到剪贴板"),
        () => toast.error("复制失败"),
      );
      return;
    }
    onAction?.(a, result);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {result.actions.map((a) => {
        const cls = `text-[12px] rounded border px-2.5 py-1 transition-colors ${STYLE_CLASS[a.style ?? "secondary"]}`;
        if (a.actionType === "OPEN_DETAIL" && a.targetRoute) {
          return (
            <Link key={a.actionId} to={a.targetRoute} className={cls} onClick={() => onAction?.(a, result)}>
              {a.label}
            </Link>
          );
        }
        return (
          <button key={a.actionId} onClick={() => handle(a)} className={cls}>
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
