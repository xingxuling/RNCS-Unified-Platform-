interface Props {
  plan: string[];
  warnings: string[];
}

export function BetaFeedbackPlan({ plan, warnings }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="aether-card p-5 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Feedback Plan</div>
          <div className="font-display text-lg gold-text">内测反馈采集计划</div>
        </div>
        <ul className="space-y-2">
          {plan.map((p, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-muted-foreground/60 mr-1">{String(i + 1).padStart(2, "0")}.</span>
              {p}
            </li>
          ))}
        </ul>
        <div className="rounded-md border border-border bg-secondary/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
          字段建议：comprehensionScore / trustScore / overwhelmScore / usefulnessScore / safetyConcern / topConfusingTerms / suggestedImprovement
        </div>
      </div>

      <div className="aether-card p-5 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Required Warnings</div>
          <div className="font-display text-lg gold-text">必显安全提示</div>
        </div>
        <ul className="space-y-2">
          {warnings.map((w, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed">· {w}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
