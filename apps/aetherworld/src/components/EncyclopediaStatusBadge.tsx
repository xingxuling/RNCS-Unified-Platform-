import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, STATUS_LABELS, type EncyclopediaStatus } from "@/constants/encyclopediaStatusTypes";
import { cn } from "@/lib/utils";

export function EncyclopediaStatusBadge({ status, className }: { status: EncyclopediaStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] tracking-wider", STATUS_COLORS[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
