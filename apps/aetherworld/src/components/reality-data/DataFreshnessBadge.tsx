import { Badge } from "@/components/ui/badge";
import type { DataFreshnessLevel } from "@/constants/reality-data/dataFreshnessLevels";

const COLORS: Record<DataFreshnessLevel, string> = {
  FRESH: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  RECENT: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  AGING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  STALE: "bg-red-500/15 text-red-700 dark:text-red-300",
  UNKNOWN: "bg-muted text-muted-foreground",
};

export function DataFreshnessBadge({ level }: { level: DataFreshnessLevel }) {
  return <Badge className={COLORS[level]} variant="outline">{level}</Badge>;
}
