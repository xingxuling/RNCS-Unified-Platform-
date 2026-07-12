// 工作流 × Chat 桥 v0.1
import {
  WORKFLOW_OVERALL_LABEL,
  WORKFLOW_STATUS_LABEL,
  WORKFLOW_STEP_LABEL,
  type TrainingWorkflow,
} from "./trainingWorkflowTypes";
import {
  buildWorkflowSnapshot,
  createTrainingWorkflow,
  createRetryFromFailedExperiment,
} from "./trainingWorkflowRuntime";
import { listWorkflows } from "./trainingWorkflowStore";
import { planNextAction } from "./trainingWorkflowNextActionPlanner";
import {
  TRAINING_WORKFLOW_SAFETY_ALLOWED,
  TRAINING_WORKFLOW_SAFETY_FORBIDDEN,
} from "./trainingWorkflowSafetyPolicy";

export type WorkflowChatFocus =
  | "OVERVIEW"
  | "CREATE"
  | "CONTINUE"
  | "RETRY"
  | "EXPLAIN"
  | "STUCK_WHERE";

const FOCUS_LABEL: Record<WorkflowChatFocus, string> = {
  OVERVIEW: "训练工作流总览",
  CREATE: "创建训练工作流",
  CONTINUE: "继续最近的训练工作流",
  RETRY: "从失败实验创建重试工作流",
  EXPLAIN: "用文明种子编译法解释训练工作流",
  STUCK_WHERE: "训练工作流卡在哪一步",
};

const KEYWORDS = [
  "训练工作流", "工作流编排", "training workflow",
  "完整训练流水线", "aetherseed 流水线",
  "卡在哪一步", "卡在哪一步训练", "继续工作流", "继续训练",
  "重试工作流", "重试训练", "失败重试",
  "用文明种子编译法解释训练工作流",
];

export function detectWorkflowIntent(raw: string): boolean {
  const t = (raw || "").toLowerCase();
  return KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function detectFocus(raw: string): WorkflowChatFocus {
  const t = (raw || "").toLowerCase();
  if (t.includes("创建") || t.includes("新建") || t.includes("生成完整")) return "CREATE";
  if (t.includes("继续")) return "CONTINUE";
  if (t.includes("重试") || t.includes("失败")) return "RETRY";
  if (t.includes("文明种子编译法")) return "EXPLAIN";
  if (t.includes("卡在") || t.includes("阻断")) return "STUCK_WHERE";
  return "OVERVIEW";
}

export interface WorkflowChatInfo {
  focus: WorkflowChatFocus;
  focusLabel: string;
  headline: string;
  bullets: string[];
  workflowId?: string;
  totalWorkflows: number;
  safetyAllowed: string[];
  safetyForbidden: string[];
}

function snapshotBullets(): string[] {
  const s = buildWorkflowSnapshot();
  return [
    `工作流总数：${s.total}`,
    `进行中：${s.inProgress} · 等待确认：${s.waitingUser} · 等待手动训练：${s.waitingManual}`,
    `已完成：${s.completed} · 失败：${s.failed}`,
  ];
}

function describeWorkflow(wf: TrainingWorkflow): string[] {
  const next = planNextAction(wf);
  return [
    `《${wf.title}》目标 ${wf.targetModel}`,
    `整体状态：${WORKFLOW_OVERALL_LABEL[wf.overallStatus]}`,
    `当前步骤：${WORKFLOW_STEP_LABEL[wf.currentStepId]}（${WORKFLOW_STATUS_LABEL[
      wf.steps.find((s) => s.id === wf.currentStepId)?.status ?? "PENDING"
    ]}）`,
    next ? `下一步建议：${next.label} — ${next.hint}` : "暂无下一步建议",
  ];
}

export function buildWorkflowChatInfo(raw: string): WorkflowChatInfo | null {
  if (!detectWorkflowIntent(raw)) return null;
  const focus = detectFocus(raw);
  const all = listWorkflows();
  const latest = all[0];
  const base = {
    focus,
    focusLabel: FOCUS_LABEL[focus],
    totalWorkflows: all.length,
    safetyAllowed: TRAINING_WORKFLOW_SAFETY_ALLOWED,
    safetyForbidden: TRAINING_WORKFLOW_SAFETY_FORBIDDEN,
  };

  switch (focus) {
    case "OVERVIEW":
      return {
        ...base,
        headline: "训练工作流总览（只读快照）",
        bullets: snapshotBullets(),
      };
    case "CREATE": {
      const wf = createTrainingWorkflow({
        title: `AetherSeed 完整训练流水线`,
        targetModel: "AetherSeed-10M",
        intent: raw,
      });
      return {
        ...base,
        headline: "已创建训练工作流（仅骨架，未启动任何训练）",
        bullets: describeWorkflow(wf),
        workflowId: wf.id,
        totalWorkflows: base.totalWorkflows + 1,
      };
    }
    case "CONTINUE":
      if (!latest) {
        return {
          ...base,
          headline: "暂无可继续的训练工作流",
          bullets: ["请在 /system/training-workflows 创建一个新工作流"],
        };
      }
      return {
        ...base,
        headline: `继续最近工作流：${latest.title}`,
        bullets: describeWorkflow(latest),
        workflowId: latest.id,
      };
    case "STUCK_WHERE":
      if (!latest) {
        return { ...base, headline: "暂无工作流可分析", bullets: snapshotBullets() };
      }
      return {
        ...base,
        headline: `最近工作流卡点分析：${latest.title}`,
        bullets: describeWorkflow(latest),
        workflowId: latest.id,
      };
    case "RETRY": {
      const wf = createRetryFromFailedExperiment(
        latest?.retryOfExperimentId ?? "未知实验",
        latest?.targetModel ?? "AetherSeed-10M",
      );
      return {
        ...base,
        headline: "已基于失败实验创建重试工作流（仅骨架）",
        bullets: describeWorkflow(wf),
        workflowId: wf.id,
      };
    }
    case "EXPLAIN":
      return {
        ...base,
        headline: "用文明种子编译法解释训练工作流",
        bullets: [
          "Seed（种子）：用户的训练意图与原料登记",
          "Skeleton（骨）：Intake / Dataset / Export / Plan 的顺序骨架",
          "Muscle（肉）：Dry-run、命令构建、参数推荐",
          "Blood（血）：metrics、checkpoint、loss、eval",
          "Nerve（神经）：Gate 策略与用户确认信号",
          "Organ（器官）：实验账本、模型血统线",
        ],
      };
  }
}
