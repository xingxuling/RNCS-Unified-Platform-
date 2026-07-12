import type { UIFitResult } from "@/lib/multiClientUIFitEngine";
import { Check, X } from "lucide-react";

export function ResponsivePreviewChecklist({ result }: { result: UIFitResult }) {
  const items: Array<{ label: string; ok: boolean; hint?: string }> = [
    { label: "推荐密度与实际密度一致", ok: result.recommendedDensity === result.actualDensity, hint: `推荐 ${result.recommendedDensity} / 实际 ${result.actualDensity}` },
    { label: "安全可见度 ≥ 70", ok: result.safetyVisibilityScore >= 70, hint: `${result.safetyVisibilityScore}/100` },
    { label: "回验可达性 ≥ 70", ok: result.feedbackAccessibilityScore >= 70, hint: `${result.feedbackAccessibilityScore}/100` },
    { label: "无 HIGH 级暴露风险", ok: !result.exposureRisks.some(r => r.level === "HIGH") },
    { label: "无导航过载", ok: result.navigationIssues.length === 0 },
    { label: "无缺失关键 CTA", ok: result.missingCTAs.length === 0 },
    { label: "UI Fit Score ≥ 70（GOOD_FIT）", ok: result.uiFitScore >= 70, hint: `${result.uiFitScore}` },
  ];

  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Responsive Preview Checklist</div>
      <div className="font-display text-lg gold-text mb-2">适配验收清单</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            {it.ok ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <X className="w-4 h-4 text-rose-400 shrink-0" />}
            <span className={it.ok ? "text-foreground/85" : "text-rose-200/90"}>{it.label}</span>
            {it.hint && <span className="text-[10px] text-muted-foreground ml-auto">{it.hint}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
