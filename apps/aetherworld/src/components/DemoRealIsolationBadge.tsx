import { Badge } from "@/components/ui/badge";
import { ISOLATION_MODE_META } from "@/constants/demoRealIsolationRules";
import type { SubjectSequenceMode } from "@/constants/subjectSequenceModes";
import { Lock, ShieldCheck, Sparkles, Upload } from "lucide-react";

interface Props {
  mode: SubjectSequenceMode;
  /** 显示完整说明 */
  withDescription?: boolean;
  className?: string;
}

const ICON: Record<SubjectSequenceMode, typeof Lock> = {
  DEMO: Sparkles,
  LIGHT_20: ShieldCheck,
  FULL_60: Lock,
  IMPORTED: Upload,
};

export function DemoRealIsolationBadge({ mode, withDescription, className }: Props) {
  const meta = ISOLATION_MODE_META[mode];
  const Icon = ICON[mode];
  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Badge variant="outline" className={`${meta.badgeClass} gap-1 font-mono text-[10px]`}>
        <Icon className="w-3 h-3" />
        {meta.label}
      </Badge>
      {withDescription && (
        <span className="text-[10px] text-muted-foreground">{meta.description}</span>
      )}
    </div>
  );
}
