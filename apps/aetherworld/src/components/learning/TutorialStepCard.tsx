import type { TutorialStep } from "@/constants/learning/lessonTemplates";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

export function TutorialStepCard({ step, index }: { step: TutorialStep; index: number }) {
  return (
    <div className="rounded-md border border-border p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
        <h4 className="text-sm font-semibold">{step.title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{step.instruction}</p>
      {step.exampleInput && (
        <div className="text-xs"><span className="text-muted-foreground">示例输入：</span><code className="bg-muted px-1 rounded">{step.exampleInput}</code></div>
      )}
      {step.expectedResult && (
        <div className="text-xs"><span className="text-muted-foreground">期望结果：</span>{step.expectedResult}</div>
      )}
      {step.targetRoute && (
        <Link to={step.targetRoute} className="text-xs text-primary hover:underline">前往 {step.targetRoute} →</Link>
      )}
      {step.warning && (
        <div className="text-xs flex items-center gap-1 text-amber-500">
          <AlertTriangle className="h-3 w-3" /> {step.warning}
        </div>
      )}
    </div>
  );
}
