import { AlertTriangle } from "lucide-react";
import { ACCURACY_TARGET, NON_APPLICABLE_DOMAINS } from "@/constants/accuracyMetrics";

interface Props {
  /** 是否已有足够回验，决定是否额外提醒"未达到该准确率时不应声称" */
  hasEnoughSamples?: boolean;
  compact?: boolean;
}

/**
 * 准确率安全边界说明 — 强制显示在所有展示 93%–95% 的页面。
 * 与 SafetyBoundaryBanner 互补：后者覆盖通用风险，本组件聚焦准确率话术。
 */
export function AccuracyDisclaimer({ hasEnoughSamples = false, compact = false }: Props) {
  if (compact) {
    return (
      <div className="text-[11px] text-muted-foreground leading-relaxed rounded-md border border-border bg-secondary/10 p-3">
        <span className="font-display text-foreground">{ACCURACY_TARGET.label}</span>{" "}
        为系统设计目标，不代表已验证准确率。预测不是绝对未来；用户的行动会改变结果。
        本系统不适用于医疗、法律、金融投资与心理临床诊断场景。
      </div>
    );
  }

  return (
    <div className="aether-card p-5 border-amber-500/30">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-2 text-xs leading-relaxed">
          <div className="font-display text-sm text-amber-300">
            Accuracy Disclaimer · 准确率安全边界
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
            <li>
              <span className="text-foreground">{ACCURACY_TARGET.label}</span> 是
              <span className="text-foreground"> 理论目标有效率</span>，不是已验证准确率，更不是保证。
            </li>
            <li>预测结果不是绝对未来；结构性概率不等于个体确定性。</li>
            <li>用户的实际行动、外部条件、社会环境都会改变最终发生的事件。</li>
            <li>
              本系统的准确率表达
              <span className="text-foreground"> 不适用 </span>
              于以下场景：{NON_APPLICABLE_DOMAINS.join(" / ")}。
            </li>
            {!hasEnoughSamples && (
              <li className="text-amber-300">
                当前真实回验样本不足，系统
                <span className="font-display"> 不会 </span>
                声称已达到该准确率。
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
