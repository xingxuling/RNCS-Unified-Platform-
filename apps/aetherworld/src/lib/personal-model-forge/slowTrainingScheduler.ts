// 慢速训练调度（草案）：把本机训练设计成夜间 / 空闲运行。
// 仅生成调度建议，不真正执行训练。
import type { ForgeExperiment } from "./personalModelForgeTypes";

export interface SlowTrainingSlotPlan {
  experimentId: string;
  experimentName: string;
  preferredWindow: "OVERNIGHT" | "IDLE_DAYTIME" | "WEEKEND";
  windowLabel: string;
  estimatedDuration: string;
  resumeStrategy: string;
  failureRecovery: string;
}

const WINDOW_LABEL: Record<SlowTrainingSlotPlan["preferredWindow"], string> = {
  OVERNIGHT: "夜间空闲（推荐）",
  IDLE_DAYTIME: "白天电脑闲置时段",
  WEEKEND: "周末长时段",
};

export function planSlowTrainingSlots(
  experiments: ForgeExperiment[],
): SlowTrainingSlotPlan[] {
  return experiments.map((e) => {
    const window = pickWindow(e);
    return {
      experimentId: e.id,
      experimentName: e.name,
      preferredWindow: window,
      windowLabel: WINDOW_LABEL[window],
      estimatedDuration: e.estimatedDuration,
      resumeStrategy: "每 N 步保存 checkpoint，可断点续训。",
      failureRecovery: "失败保留 loss 曲线 / 报错日志，下一轮直接复用数据继续跑。",
    };
  });
}

function pickWindow(e: ForgeExperiment): SlowTrainingSlotPlan["preferredWindow"] {
  if (/周|1~2\s*周|数周/.test(e.estimatedDuration)) return "WEEKEND";
  if (/天|1\s*天|数天/.test(e.estimatedDuration)) return "OVERNIGHT";
  return "IDLE_DAYTIME";
}
