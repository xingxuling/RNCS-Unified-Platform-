import type { BetaRiskEvaluation } from "@/lib/betaLaunchCalculus";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface Props {
  risks: BetaRiskEvaluation[];
  publicLaunchBlocked: boolean;
}

const tone = (lvl: "LOW" | "MEDIUM" | "HIGH") =>
  lvl === "HIGH"
    ? "border-destructive/60 text-destructive"
    : lvl === "MEDIUM"
    ? "border-amber-500/60 text-amber-400"
    : "border-emerald-500/50 text-emerald-400";

export function BetaRiskGate({ risks, publicLaunchBlocked }: Props) {
  return (
    <div className="aether-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beta Risk Gate</div>
          <div className="font-display text-lg gold-text">内测风险门</div>
        </div>
        {publicLaunchBlocked ? (
          <Badge variant="outline" className="border-destructive/60 text-destructive">
            <ShieldAlert className="w-3 h-3 mr-1" /> 公开发布已阻断
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
            <ShieldCheck className="w-3 h-3 mr-1" /> 无高危阻断
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {risks.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-secondary/20 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-sm">{r.cn}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.en}</div>
              </div>
              <Badge variant="outline" className={tone(r.level)}>
                {r.level}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-muted-foreground/80">原因：</span>
              {r.whyItMatters}
            </div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-muted-foreground/80">缓解：</span>
              {r.mitigation}
            </div>
            {r.blocksPublicLaunch && (
              <div className="text-[10px] text-destructive">⛔ 该高危项目前阻断公开发布。</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
