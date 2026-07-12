import type { ChatConfirmationData } from "@/lib/chat/chatMessageEngine";

interface Props {
  data: ChatConfirmationData;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function ChatConfirmCard({ data, onConfirm, onCancel }: Props) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-amber-400">需要确认</div>
      <div className="text-sm text-foreground/90">
        即将执行：<span className="font-medium">{data.action}</span>
      </div>
      <div className="text-[11px] text-muted-foreground">{data.reason}</div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onConfirm}
          className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90"
        >
          确认执行
        </button>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-muted/40"
        >
          取消
        </button>
      </div>
    </div>
  );
}
