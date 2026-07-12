// Chat → Scheduler 桥：检测 Chat 输入是否需要创建调度任务。
import { createAetherTask } from "./aetherSchedulerRuntime";
import type { AetherTask, AetherTaskType } from "./aetherSchedulerTypes";

// 触发词（中文 + 英文常见动作）
const TRIGGERS: Array<{ re: RegExp; hint?: AetherTaskType }> = [
  { re: /创建.*(app|应用|小程序|工具|番茄钟|计时器)/i, hint: "APP_CREATE" },
  { re: /(检查|review).*代码|代码.*(检查|审计)/i, hint: "CODE_CHECK" },
  { re: /(修复|repair|fix).*代码|代码.*(修复|fix)/i, hint: "CODE_REPAIR" },
  { re: /(发布|分享|推).*社交/i, hint: "SOCIAL_DRAFT" },
  { re: /(明天|今天|后天|下午|上午|晚上|点钟|提醒我|remind\s+me)/i, hint: "CALENDAR_REMINDER" },
  { re: /(预测|趋势|未来.*会|forecast|predict)/i, hint: "PREDICTION_RUN" },
  { re: /(保存|存入|放到).*工作区/i, hint: "WORKSPACE_SAVE" },
  { re: /(安装).*(能力包|插件|webxxm)/i, hint: "STORE_INSTALL" },
  { re: /(跑|执行|启动).*qa|qa.?审计/i, hint: "QA_AUDIT" },
];

export interface ChatSchedulerTriggerResult {
  triggered: boolean;
  tasks: AetherTask[];
}

export function maybeCreateChatTask(opts: {
  rawInput: string;
  chatMessageId: string;
  predictionInfoId?: string;
  mslFrameId?: string;
  currencyEventId?: string;
}): ChatSchedulerTriggerResult {
  const raw = opts.rawInput.trim();
  if (!raw) return { triggered: false, tasks: [] };

  const hints: AetherTaskType[] = [];
  for (const t of TRIGGERS) {
    if (t.re.test(raw) && t.hint) {
      if (!hints.includes(t.hint)) hints.push(t.hint);
    }
  }
  if (hints.length === 0) return { triggered: false, tasks: [] };

  const tasks = hints.slice(0, 3).map((h) =>
    createAetherTask({
      source: "CHAT",
      rawInput: raw,
      hint: h,
      relatedChatMessageId: opts.chatMessageId,
      relatedPredictionId: opts.predictionInfoId,
      relatedMslFrameId: opts.mslFrameId,
      relatedCurrencyEventId: opts.currencyEventId,
    }),
  );
  return { triggered: true, tasks };
}

export interface ChatSchedulerSummary {
  taskCount: number;
  primary?: {
    id: string;
    title: string;
    taskType: string;
    status: string;
    requiresConfirmation: boolean;
    safetyStatus: string;
    planStepCount: number;
    riskLevel: string;
  };
  tasks: AetherTask[];
}

export function buildChatSchedulerSummary(tasks: AetherTask[]): ChatSchedulerSummary {
  const primary = tasks[0];
  return {
    taskCount: tasks.length,
    primary: primary
      ? {
          id: primary.id,
          title: primary.title,
          taskType: primary.taskType,
          status: primary.status,
          requiresConfirmation: primary.requiredConfirmation,
          safetyStatus: primary.safetyStatus,
          planStepCount: primary.plan?.steps.length ?? 0,
          riskLevel: primary.plan?.riskLevel ?? "LOW",
        }
      : undefined,
    tasks,
  };
}
