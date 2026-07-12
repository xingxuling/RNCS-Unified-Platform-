import type { IntensityLevel } from "@/lib/predictionEngine";
import { cn } from "@/lib/utils";

export const LEVEL_LABEL: Record<IntensityLevel, string> = {
  low: "低触发", mid: "中触发", high: "强触发", peak: "极强触发",
};

export const LEVEL_COLOR: Record<IntensityLevel, string> = {
  low:  "bg-trigger-low/30 text-muted-foreground border-trigger-low/40",
  mid:  "bg-trigger-mid/25 text-foreground border-trigger-mid/40",
  high: "bg-trigger-high/25 text-trigger-high border-trigger-high/50",
  peak: "bg-trigger-peak/25 text-trigger-peak border-trigger-peak/60",
};

export function TriggerBadge({ level, score }: { level: IntensityLevel; score?: number }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono",
      LEVEL_COLOR[level],
    )}>
      <span className="w-1.5 h-1.5 rounded-full" style={{
        background: level === "peak" ? "var(--trigger-peak)" :
                    level === "high" ? "var(--trigger-high)" :
                    level === "mid" ? "var(--trigger-mid)" : "var(--trigger-low)",
        boxShadow: `0 0 8px ${
          level === "peak" ? "var(--trigger-peak)" :
          level === "high" ? "var(--trigger-high)" : "transparent"
        }`,
      }} />
      {LEVEL_LABEL[level]}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

export function TriggerBar({ score }: { score: number }) {
  return (
    <div className="relative h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 trigger-bar"
        style={{ width: `${score}%` }}
      />
    </div>
  );
}
