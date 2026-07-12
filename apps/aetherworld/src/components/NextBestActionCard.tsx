import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  ONBOARDING_STAGE_META,
  type OnboardingStage,
} from "@/constants/onboardingUserStates";

/**
 * NextBestActionCard · 下一步动作卡
 * 每个阶段只显示一个最推荐动作，避免选择焦虑。
 */
export function NextBestActionCard({ stage }: { stage: OnboardingStage }) {
  const meta = ONBOARDING_STAGE_META[stage];
  return (
    <Card className="p-5 aether-card space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Next Best Action · 下一步推荐
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">当前阶段</div>
        <div className="font-display text-base">{meta.cn}</div>
        <div className="text-[11px] text-muted-foreground/80">{meta.description}</div>
      </div>
      <Button asChild className="w-full justify-between">
        <Link to={meta.nextActionUrl}>
          <span>{meta.nextActionCN}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </Card>
  );
}
