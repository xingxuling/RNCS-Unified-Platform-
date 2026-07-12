import { MoreHorizontal } from "lucide-react";

export interface MobileObjectCardProps {
  name: string;
  typeTag?: string;
  status?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  onMore?: () => void;
}

export function MobileObjectCard({ name, typeTag, status, primaryLabel = "打开", onPrimary, onMore }: MobileObjectCardProps) {
  return (
    <div className="aether-card p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{name}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          {typeTag && <span className="px-1.5 py-0.5 rounded bg-muted/40">{typeTag}</span>}
          {status && <span>{status}</span>}
        </div>
      </div>
      <button onClick={onPrimary} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs">
        {primaryLabel}
      </button>
      <button onClick={onMore} aria-label="更多" className="p-1.5 text-muted-foreground">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}
