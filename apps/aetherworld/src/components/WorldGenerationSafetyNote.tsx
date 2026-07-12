import { AlertTriangle } from "lucide-react";

interface Props { mode: string; privacyNote?: string; }

export function WorldGenerationSafetyNote({ mode, privacyNote }: Props) {
  return (
    <div className="aether-card p-4 border-l-2 border-primary/60 space-y-2">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <AlertTriangle className="w-3.5 h-3.5" /> Safety Boundary · 安全说明
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">
        这是基于你输入数据生成的<strong>象征性个人世界模型</strong>，用于自我理解、创作、决策辅助与结构可视化。
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        它不代表绝对命运，不构成医疗、法律、金融、投资或心理诊断建议。当前模式：<span className="text-primary">{mode}</span>。
      </p>
      {privacyNote && (
        <p className="text-xs text-amber-400/90 leading-relaxed">{privacyNote}</p>
      )}
    </div>
  );
}
