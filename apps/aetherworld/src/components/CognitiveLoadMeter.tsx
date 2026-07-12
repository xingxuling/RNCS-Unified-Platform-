import type { UIFitResult } from "@/lib/multiClientUIFitEngine";
import { UI_DENSITY, densityIndex } from "@/constants/uiDensityLevels";

export function CognitiveLoadMeter({ result }: { result: UIFitResult }) {
  const actual = densityIndex(result.actualDensity);
  const recommended = densityIndex(result.recommendedDensity);
  const overload = Math.max(0, actual - recommended);

  const tone =
    overload >= 2 ? "bg-rose-500" :
    overload === 1 ? "bg-amber-500" :
    "bg-emerald-500";

  return (
    <div className="aether-card p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Cognitive Load · 认知负载
      </div>
      <div className="font-display text-lg gold-text">认知负载表</div>

      <div className="mt-3 grid grid-cols-4 gap-1">
        {(["LOW","MEDIUM","HIGH","EXPERT"] as const).map((lvl, i) => {
          const reached = i <= actual;
          const rec = i === recommended;
          return (
            <div key={lvl} className={`rounded-sm border h-12 flex flex-col items-center justify-center text-[10px] ${
              reached ? `${tone} text-white border-transparent` : "border-border/50 text-muted-foreground"
            }`}>
              <div>{UI_DENSITY[lvl].cn}</div>
              {rec && <div className="text-[9px]">推荐</div>}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-foreground/80 leading-relaxed">
        实际密度：<span className="text-primary">{UI_DENSITY[result.actualDensity].cn}</span> ·
        推荐：<span className="text-primary">{UI_DENSITY[result.recommendedDensity].cn}</span>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {overload >= 2 ? "认知负载严重过高，建议明显降级密度。" :
           overload === 1 ? "认知负载偏高，可适度简化首屏。" :
           "认知负载在用户可承受范围内。"}
        </div>
      </div>
    </div>
  );
}
