import type { UIFitResult } from "@/lib/multiClientUIFitEngine";
import { Lightbulb } from "lucide-react";

export function UIFitRecommendationBoard({ result }: { result: UIFitResult }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Recommendation Board
          </div>
          <div className="font-display text-lg gold-text">UI 适配建议板</div>
        </div>
      </div>

      <div className="gold-divider my-3" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <Section title="推荐密度 / 默认入口">
          <li>推荐 UI 密度：{result.recommendedDensity}</li>
          <li>当前实际密度：{result.actualDensity}</li>
          <li>缺失 CTA：{result.missingCTAs.length ? result.missingCTAs.join("、") : "无"}</li>
        </Section>

        <Section title="隐藏 / 暴露">
          <li>建议隐藏模块：{result.hiddenRecommended.length ? result.hiddenRecommended.join("、") : "无"}</li>
          <li>导航问题：{result.navigationIssues.length ? result.navigationIssues.join("；") : "无"}</li>
          <li>是否企业安全模式：{result.enterpriseSafeMode ? "是（替换词表已启用）" : "否"}</li>
        </Section>

        <Section title="安全 / 回验">
          <li>安全可见度：{result.safetyVisibilityScore}/100</li>
          <li>回验可达性：{result.feedbackAccessibilityScore}/100</li>
          <li>HIGH 风险：{result.exposureRisks.filter(r => r.level === "HIGH").length}</li>
        </Section>

        <Section title="移动端 / 替代视图">
          <li>设备禁忌：{result.overloadedAreas.join("、") || "—"}</li>
          <li>若分数 &lt; 70，建议改为分段卡片或只读摘要</li>
          <li>Full 60 在小屏只允许只读</li>
        </Section>
      </div>

      <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3">
        <div className="text-[10px] uppercase tracking-widest text-primary mb-1.5">综合建议</div>
        <ul className="text-xs text-foreground/90 space-y-1">
          {result.recommendations.map((r, i) => <li key={i}>· {r}</li>)}
        </ul>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-border/60 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{title}</div>
      <ul className="text-xs text-foreground/85 space-y-0.5 list-disc list-inside">
        {children}
      </ul>
    </div>
  );
}
