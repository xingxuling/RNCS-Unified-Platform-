import type { AetherStoreItemStatus } from "@/constants/store/storeItemStatuses";
import { STORE_STATUS_LABEL, STORE_STATUS_TONE } from "@/constants/store/storeItemStatuses";

interface Props {
  status: AetherStoreItemStatus;
}

const TONE_CLASS: Record<string, string> = {
  muted:   "bg-muted/40 text-muted-foreground border-border/50",
  primary: "bg-primary/10 text-primary border-primary/30",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  warn:    "bg-amber-500/10 text-amber-400 border-amber-500/30",
  danger:  "bg-destructive/10 text-destructive border-destructive/30",
};

export function StoreStatusBadge({ status }: Props) {
  const tone = STORE_STATUS_TONE[status];
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] tracking-wide ${TONE_CLASS[tone]}`}>
      {STORE_STATUS_LABEL[status]}
    </span>
  );
}
