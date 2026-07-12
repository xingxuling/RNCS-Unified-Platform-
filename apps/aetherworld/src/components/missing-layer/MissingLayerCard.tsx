import type { MissingLayerIssue } from "@/lib/missing-layer/missingLayerDetectionCalculus";
import { MISSING_LAYER_LABELS } from "@/constants/missing-layer/missingLayerTypes";
import { SEVERITY_LABELS } from "@/constants/missing-layer/missingLayerSeverityLevels";

export function MissingLayerCard({ issue }: { issue: MissingLayerIssue }) {
  const sevColor = issue.severity === "CRITICAL" ? "text-red-400" : issue.severity === "HIGH" ? "text-amber-400" : issue.severity === "MEDIUM" ? "text-yellow-300" : "text-muted-foreground";
  return (
    <div className="border border-border/40 rounded p-3 space-y-1 text-xs bg-background/30">
      <div className="flex items-center justify-between">
        <span className="font-medium">{MISSING_LAYER_LABELS[issue.missingLayerType]}</span>
        <span className={`text-[10px] ${sevColor}`}>{SEVERITY_LABELS[issue.severity]}</span>
      </div>
      <div className="text-muted-foreground">{issue.explanation}</div>
      <div className="text-[10px] text-primary/80">建议：{issue.suggestedFix}</div>
      {issue.affectedModules.length > 0 && (
        <div className="text-[10px] text-muted-foreground">影响：{issue.affectedModules.join(", ")}</div>
      )}
    </div>
  );
}
