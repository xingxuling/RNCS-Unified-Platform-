import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  computeSafetyLevel,
  SAFETY_BOUNDARY_COPY,
} from "@/constants/safetyBoundaryRules";
import type { CurrentPage, RiskLevel } from "@/constants/manualGuidanceRules";
import type { SubjectSequenceMode } from "@/constants/subjectSequenceModes";

interface Props {
  page: CurrentPage;
  subjectMode: SubjectSequenceMode;
  keywords?: string[];
  determinationLocked?: boolean;
  /** 手动覆盖等级 */
  forceLevel?: RiskLevel;
  className?: string;
  compact?: boolean;
}

export function SafetyBoundaryBanner({
  page,
  subjectMode,
  keywords,
  determinationLocked,
  forceLevel,
  className,
  compact,
}: Props) {
  const level =
    forceLevel ??
    computeSafetyLevel({ page, subjectMode, keywords, determinationLocked });
  const copy = SAFETY_BOUNDARY_COPY[level];

  const Icon = level === "HIGH" ? ShieldAlert : level === "MEDIUM" ? Shield : ShieldCheck;
  const tone =
    level === "HIGH"
      ? "border-rose-500/40 bg-rose-500/5 text-rose-200"
      : level === "MEDIUM"
      ? "border-amber-500/40 bg-amber-500/5 text-amber-200"
      : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200";

  return (
    <div className={`aether-card border ${tone} ${compact ? "p-2" : "p-3"} flex items-start gap-3 ${className ?? ""}`}>
      <Icon className={`shrink-0 ${compact ? "w-3.5 h-3.5" : "w-4 h-4"} mt-0.5`} />
      <div className="flex-1 leading-relaxed">
        <div className={`font-medium ${compact ? "text-[11px]" : "text-xs"}`}>{copy.title}</div>
        <div className={`text-muted-foreground ${compact ? "text-[10px]" : "text-[11px]"} mt-0.5`}>{copy.message}</div>
      </div>
      <span className="text-[10px] uppercase tracking-widest opacity-70">{level}</span>
    </div>
  );
}
