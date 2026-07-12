import { SimpleStartPanel } from "./SimpleStartPanel";
import { DemoFirstEntry } from "./DemoFirstEntry";
import { NextBestActionCard } from "./NextBestActionCard";
import { BeginnerModeToggle } from "./BeginnerModeToggle";
import type { OnboardingStage } from "@/constants/onboardingUserStates";

/**
 * SimplifiedHome · 新手模式下的首页
 * 只展示：开始面板 / Demo / 下一步动作 / 模式切换。
 */
export function SimplifiedHome({ stage }: { stage: OnboardingStage }) {
  return (
    <div className="px-6 md:px-10 py-6 space-y-6">
      <SimpleStartPanel />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <DemoFirstEntry />
        </div>
        <div className="space-y-4">
          <NextBestActionCard stage={stage} />
          <BeginnerModeToggle />
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground/70 text-center">
        想看完整系统？右上角切换到「高级模式」即可显示主控台、综合判断内核、回验权重、QA、重算等模块。
      </div>
    </div>
  );
}
