import type { ChatDisplayResultQa } from "@/lib/chat/chatDisplayResultTypes";

const QA_META: Record<ChatDisplayResultQa, { label: string; cls: string }> = {
  PASS:        { label: "QA 通过",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  WARN:        { label: "QA 警告",   cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  FAIL:        { label: "QA 失败",   cls: "bg-destructive/10 text-destructive border-destructive/30" },
  BLOCKED:     { label: "已阻断",     cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" },
  NOT_CHECKED: { label: "未检查",     cls: "bg-muted/40 text-muted-foreground border-border/50" },
};

export function ChatResultQaBadge({ status }: { status: ChatDisplayResultQa }) {
  const m = QA_META[status];
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] tracking-wide ${m.cls}`}>
      {m.label}
    </span>
  );
}
