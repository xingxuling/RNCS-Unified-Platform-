import { Lock, ShieldCheck } from "lucide-react";
import type { QAScanResult } from "@/lib/softwareQAFeedbackCalculus";
import { ISOLATION_MODE_META } from "@/constants/demoRealIsolationRules";
import { DemoRealIsolationBadge } from "./DemoRealIsolationBadge";

export function QAIsolationAudit({ result }: { result: QAScanResult }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Demo / Real Isolation Audit · 隔离审计
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <h2 className="font-display text-lg gold-text">主体模式隔离</h2>
        <span className="text-[11px] text-muted-foreground">
          隔离得分 {result.isolationScore}/100
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 mt-4">
        {Object.values(ISOLATION_MODE_META).map((m) => (
          <div key={m.key} className="p-3 rounded-md border border-border/60 bg-secondary/15">
            <div className="flex items-center justify-between">
              <DemoRealIsolationBadge mode={m.key} />
              <span className="text-[10px] text-muted-foreground">
                {m.isRealSubject ? "真实主体" : "模拟主体"}
              </span>
            </div>
            <div className="text-xs mt-2">{m.fullLabel}</div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              {m.description}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 text-[11px] text-emerald-200 flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5" />
        <div className="leading-relaxed">
          Demo 回验不会进入真实主体权重学习；真实主体回验不会污染 Demo。
          删除真实主体时会清理对应权重与隔离标记。
        </div>
      </div>
    </div>
  );
}
