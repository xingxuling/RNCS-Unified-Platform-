import type { BetaUserSegment } from "@/constants/betaUserSegments";
import { BETA_ACCESS_LEVELS } from "@/constants/betaAccessLevels";
import { Badge } from "@/components/ui/badge";

interface Props {
  segment: BetaUserSegment;
  recommended?: boolean;
  onPick?: (id: BetaUserSegment["id"]) => void;
  active?: boolean;
}

const levelTone = (lvl: "LOW" | "MEDIUM" | "HIGH") =>
  lvl === "HIGH"
    ? "border-destructive/50 text-destructive"
    : lvl === "MEDIUM"
    ? "border-amber-500/50 text-amber-400"
    : "border-emerald-500/50 text-emerald-400";

export function BetaUserSegmentCard({ segment, recommended, onPick, active }: Props) {
  return (
    <button
      type="button"
      onClick={() => onPick?.(segment.id)}
      className={`text-left aether-card p-4 space-y-3 transition w-full ${
        active ? "border-primary/60" : recommended ? "border-emerald-500/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-base">{segment.cn}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{segment.en}</div>
        </div>
        {recommended && (
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[10px]">
            推荐
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{segment.desc}</p>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <Stat label="Fit" value={`${segment.fitScore}`} />
        <Stat label="Risk" value={`${segment.riskScore}`} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className={levelTone(segment.feedbackQuality)}>
          反馈质量 {segment.feedbackQuality}
        </Badge>
        <Badge variant="outline" className={levelTone(segment.onboardingDifficulty)}>
          上手难度 {segment.onboardingDifficulty}
        </Badge>
        <Badge variant="outline" className={levelTone(segment.privacySensitivity)}>
          隐私敏感 {segment.privacySensitivity}
        </Badge>
        <Badge variant="outline" className={levelTone(segment.misuseRisk)}>
          误用风险 {segment.misuseRisk}
        </Badge>
      </div>

      <div className="pt-2 border-t border-border/50">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">推荐访问等级</div>
        <div className="flex flex-wrap gap-1">
          {segment.recommendedAccessLevels.map((id) => (
            <span
              key={id}
              className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-secondary/30 text-muted-foreground"
            >
              {BETA_ACCESS_LEVELS[id].label} · {BETA_ACCESS_LEVELS[id].cn}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-secondary/20 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-sm">{value}</div>
    </div>
  );
}
