import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import {
  ONBOARDING_STAGE_META,
  type OnboardingStage,
} from "@/constants/onboardingUserStates";

const STAGE_ORDER: OnboardingStage[] = [
  "FRESH_VISITOR",
  "DEMO_VIEWED",
  "PREDICTION_OPENED",
  "FEEDBACK_LOGGED",
  "LIGHT_MODEL_CREATED",
  "EXPERT",
];

export function OnboardingProgress({ stage }: { stage: OnboardingStage }) {
  const idx = STAGE_ORDER.indexOf(stage);
  const pct = Math.round(((idx + 1) / STAGE_ORDER.length) * 100);

  return (
    <Card className="p-5 aether-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Onboarding Progress · 入门进度
        </div>
        <Badge variant="outline">{pct}%</Badge>
      </div>
      <Progress value={pct} className="h-2" />
      <ul className="space-y-1.5">
        {STAGE_ORDER.map((s, i) => {
          const meta = ONBOARDING_STAGE_META[s];
          const done = i <= idx;
          return (
            <li key={s} className="flex items-center gap-2 text-xs">
              {done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <span className={done ? "text-foreground" : "text-muted-foreground"}>
                {meta.cn}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
