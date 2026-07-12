import type { UIFitResult } from "@/lib/multiClientUIFitEngine";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";

const LEVEL_TONE: Record<string, string> = {
  HIGH:   "border-rose-500/40 text-rose-300 bg-rose-500/5",
  MEDIUM: "border-amber-500/40 text-amber-300 bg-amber-500/5",
  LOW:    "border-cyan-500/40 text-cyan-300 bg-cyan-500/5",
};

export function UIExposureRiskPanel({ result }: { result: UIFitResult }) {
  return (
    <div className="aether-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            UI Exposure Risks
          </div>
          <div className="font-display text-lg gold-text">UI 暴露风险</div>
        </div>
        <div className="text-[10px] text-muted-foreground">
          共 {result.exposureRisks.length} 条
        </div>
      </div>

      <div className="gold-divider my-3" />

      {result.exposureRisks.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">当前组合未检出显式暴露风险。</div>
      ) : (
        <ul className="space-y-2">
          {result.exposureRisks.map((r, i) => {
            const Icon = r.level === "HIGH" ? ShieldAlert : r.level === "MEDIUM" ? AlertTriangle : Info;
            return (
              <li key={i} className={`rounded-md border px-3 py-2 ${LEVEL_TONE[r.level]}`}>
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">
                      [{r.level}] {r.cn}
                      <span className="ml-2 text-[10px] text-muted-foreground">{r.en}</span>
                    </div>
                    <div className="text-[11px] text-foreground/80 mt-1 leading-relaxed">
                      {r.affectedClient} × {r.affectedDevice}
                    </div>
                    <div className="text-[11px] text-foreground/85 mt-1">
                      建议：{r.recommendedFix}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
