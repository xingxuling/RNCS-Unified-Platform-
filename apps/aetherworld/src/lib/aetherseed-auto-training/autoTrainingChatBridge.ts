// AetherSeed Auto Training Executor · Chat 桥
import { buildAutoTrainingSnapshot, listTasks, getDryRun, getCommands } from "./autoTrainingTaskStore";
import { detectProcessBridge } from "./autoTrainingProcessBridge";
import { AUTO_TRAINING_SAFETY_ALLOWED, AUTO_TRAINING_SAFETY_FORBIDDEN } from "./autoTrainingSafetyPolicy";
import { previewCommand } from "./autoTrainingCommandBuilder";
import { AUTO_TRAINING_STATUS_LABEL, AUTO_TRAINING_ENV_LABEL } from "./autoTrainingTypes";

export type AutoTrainingChatFocus =
  | "OVERVIEW"
  | "CREATE"
  | "DRY_RUN"
  | "COMMAND_PREVIEW"
  | "CONFIRMATION"
  | "FAILURE"
  | "SAFETY"
  | "SEED_EXPLAIN";

const FOCUS_LABEL: Record<AutoTrainingChatFocus, string> = {
  OVERVIEW: "自动训练总览",
  CREATE: "创建自动训练任务",
  DRY_RUN: "Dry-run 校验",
  COMMAND_PREVIEW: "命令预览",
  CONFIRMATION: "用户确认流程",
  FAILURE: "最近失败",
  SAFETY: "安全边界",
  SEED_EXPLAIN: "文明种子编译法解释",
};

const TRIGGERS = [
  "自动训练", "auto training", "auto-train",
  "训练执行", "受控训练", "训练执行器",
  "dry-run", "dry run", "命令预览",
  "开始自动训练", "训练能不能跑",
];

export function detectAutoTrainingIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return TRIGGERS.some((k) => t.includes(k.toLowerCase()));
}

function pickFocus(raw: string): AutoTrainingChatFocus {
  const t = raw.toLowerCase();
  if (/文明种子|种子编译/.test(t)) return "SEED_EXPLAIN";
  if (/安全|边界|forbidden|禁止/.test(t)) return "SAFETY";
  if (/失败|卡在|fail/.test(t)) return "FAILURE";
  if (/确认|需要我确认|确认什么/.test(t)) return "CONFIRMATION";
  if (/命令预览|preview/.test(t)) return "COMMAND_PREVIEW";
  if (/dry.?run|能不能跑/.test(t)) return "DRY_RUN";
  if (/创建|新建/.test(t)) return "CREATE";
  return "OVERVIEW";
}

export interface ChatAutoTrainingInfo {
  question: string;
  focus: AutoTrainingChatFocus;
  focusLabel: string;
  summary: string;
  snapshot: ReturnType<typeof buildAutoTrainingSnapshot>;
  bridge: { kind: string; description: string };
  latestTask?: {
    id: string;
    name: string;
    status: string;
    safetyStatus: string;
    environmentStatus?: string;
    canRun?: boolean;
    commandPreview: string[];
    blockedReasons: string[];
  };
  safetyAllowed: string[];
  safetyForbidden: string[];
  workbenchHint: string;
}

function summarize(focus: AutoTrainingChatFocus, snap: ReturnType<typeof buildAutoTrainingSnapshot>): string {
  switch (focus) {
    case "CREATE": return "可在 /system/auto-training 从最近的 LocalTrainingPlan 创建自动训练任务，系统会先进入 dry-run 阶段。";
    case "DRY_RUN": return "Dry-run 会校验白名单命令、数据集、安全状态与运行环境；若浏览器内无本地网关，会标记 NEEDS_LOCAL_GATEWAY。";
    case "COMMAND_PREVIEW": return "命令以 executable+args 结构化生成，不使用 shell:true，不拼接字符串。";
    case "CONFIRMATION": return "在 WAITING_CONFIRMATION 状态下，必须由用户在 /system/auto-training 点击确认按钮后才能进入 READY_TO_RUN。";
    case "FAILURE": return snap.failed === 0 ? "暂无失败任务。" : `共 ${snap.failed} 个失败任务，详见 /system/auto-training。`;
    case "SAFETY": return "Auto Training Executor 严格白名单 + dry-run + 用户确认 + 安全 IPC；浏览器内永远不真实执行。";
    case "SEED_EXPLAIN": return "文明种子编译法定位：Auto Training Executor 是 AetherSeed 的「训练执行肌肉」，不是计划器，也不是自由 shell。";
    case "OVERVIEW":
    default: return `共 ${snap.total} 个任务：等待确认 ${snap.waitingConfirmation}，运行中 ${snap.running}，完成 ${snap.completed}，失败 ${snap.failed}，拦截 ${snap.blocked}。`;
  }
}

export function buildChatAutoTrainingInfo(raw: string): ChatAutoTrainingInfo | undefined {
  if (!detectAutoTrainingIntent(raw)) return undefined;
  const focus = pickFocus(raw);
  const snap = buildAutoTrainingSnapshot();
  const bridge = detectProcessBridge();
  const tasks = listTasks();
  const latest = tasks[0];
  const dry = latest ? getDryRun(latest.id) : undefined;
  const cmds = latest ? getCommands(latest.id) : [];

  return {
    question: raw,
    focus,
    focusLabel: FOCUS_LABEL[focus],
    summary: summarize(focus, snap),
    snapshot: snap,
    bridge: { kind: bridge.kind, description: bridge.description },
    latestTask: latest
      ? {
          id: latest.id,
          name: latest.name,
          status: AUTO_TRAINING_STATUS_LABEL[latest.status],
          safetyStatus: latest.safetyStatus,
          environmentStatus: dry ? AUTO_TRAINING_ENV_LABEL[dry.environmentStatus] : undefined,
          canRun: dry?.canRun,
          commandPreview: cmds.map(previewCommand),
          blockedReasons: latest.blockedReasons,
        }
      : undefined,
    safetyAllowed: AUTO_TRAINING_SAFETY_ALLOWED,
    safetyForbidden: AUTO_TRAINING_SAFETY_FORBIDDEN,
    workbenchHint: "前往 /system/auto-training 创建任务、运行 dry-run、查看命令预览并完成用户确认。",
  };
}
