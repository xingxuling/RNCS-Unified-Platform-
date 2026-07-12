export interface CoreModelCardProps {
  title: string;
  tag: string;
  description: string;
  status: string;
  statusTone?: "muted" | "ready" | "loading" | "warn" | "error";
  primaryLabel: string;
  onPrimary?: () => void;
  onDetail?: () => void;
  disabled?: boolean;
}

const toneMap = {
  muted: "text-muted-foreground",
  ready: "text-emerald-400",
  loading: "text-sky-400",
  warn: "text-amber-400",
  error: "text-rose-400",
} as const;

export function CoreModelCard({
  title, tag, description, status, statusTone = "muted",
  primaryLabel, onPrimary, onDetail, disabled,
}: CoreModelCardProps) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">{tag}</div>
        </div>
        <span className={`text-[10px] ${toneMap[statusTone]}`}>{status}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrimary}
          disabled={disabled}
          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs disabled:opacity-50"
        >
          {primaryLabel}
        </button>
        {onDetail && (
          <button onClick={onDetail} className="px-3 py-1.5 rounded-md border border-border/40 text-xs">
            查看详情
          </button>
        )}
      </div>
    </div>
  );
}
