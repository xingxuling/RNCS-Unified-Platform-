// 任务分类器：根据原始输入 + 来源推断 taskType / priority / 是否需要确认
import type {
  AetherTaskPriority,
  AetherTaskSource,
  AetherTaskType,
} from "./aetherSchedulerTypes";

export interface ClassifyInput {
  source: AetherTaskSource;
  rawInput: string;
  hint?: AetherTaskType;
}

export interface ClassifyResult {
  taskType: AetherTaskType;
  title: string;
  priority: AetherTaskPriority;
  requiredConfirmation: boolean;
  assignedModule: string;
}

const RULES: Array<{
  test: (s: string) => boolean;
  taskType: AetherTaskType;
  module: string;
  needsConfirm?: boolean;
  priority?: AetherTaskPriority;
}> = [
  { test: (s) => /创建.*(app|应用|小程序|工具)/i.test(s), taskType: "APP_CREATE", module: "APP_RUNTIME", priority: "P1" },
  { test: (s) => /检查.*代码|代码.*检查|code.?check/i.test(s), taskType: "CODE_CHECK", module: "CODE_SANDBOX", priority: "P2" },
  { test: (s) => /修复.*代码|代码.*修复|repair/i.test(s), taskType: "CODE_REPAIR", module: "CODE_SANDBOX", priority: "P1" },
  { test: (s) => /发布.*社交|分享.*到.*社交|publish/i.test(s), taskType: "SOCIAL_DRAFT", module: "SOCIAL", needsConfirm: true, priority: "P1" },
  { test: (s) => /提醒|明天|后天|下午|上午|晚上|点钟|remind/i.test(s), taskType: "CALENDAR_REMINDER", module: "CALENDAR", priority: "P2" },
  { test: (s) => /预测|趋势|未来|forecast|predict/i.test(s), taskType: "PREDICTION_RUN", module: "SEQUENCE_PREDICTION", priority: "P2" },
  { test: (s) => /保存.*工作区|存入.*工作区|workspace/i.test(s), taskType: "WORKSPACE_SAVE", module: "WORKSPACE", priority: "P2" },
  { test: (s) => /安装.*能力包|安装.*插件|install/i.test(s), taskType: "STORE_INSTALL", module: "STORE", needsConfirm: true, priority: "P1" },
  { test: (s) => /qa.?审计|质量审计|跑.*qa/i.test(s), taskType: "QA_AUDIT", module: "QA", priority: "P2" },
  { test: (s) => /生成.*世界|世界.*生成/i.test(s), taskType: "WORLD_GENERATE", module: "WORLD_RUNTIME", priority: "P2" },
  { test: (s) => /生成.*音乐|作曲|music/i.test(s), taskType: "MUSIC_CREATE", module: "VOCAL", priority: "P2" },
];

export function classifyTask(input: ClassifyInput): ClassifyResult {
  const raw = input.rawInput || "";
  if (input.hint) {
    return {
      taskType: input.hint,
      title: makeTitle(input.hint, raw),
      priority: "P2",
      requiredConfirmation: needsConfirmDefault(input.hint),
      assignedModule: defaultModule(input.hint),
    };
  }
  for (const r of RULES) {
    if (r.test(raw)) {
      return {
        taskType: r.taskType,
        title: makeTitle(r.taskType, raw),
        priority: r.priority ?? "P2",
        requiredConfirmation: r.needsConfirm ?? needsConfirmDefault(r.taskType),
        assignedModule: r.module,
      };
    }
  }
  return {
    taskType: "MODEL_ANSWER",
    title: makeTitle("MODEL_ANSWER", raw),
    priority: "P3",
    requiredConfirmation: false,
    assignedModule: "CHAT",
  };
}

function makeTitle(type: AetherTaskType, raw: string): string {
  const head = raw.trim().slice(0, 28) || "未命名任务";
  return `[${labelOf(type)}] ${head}`;
}

function labelOf(t: AetherTaskType): string {
  const map: Partial<Record<AetherTaskType, string>> = {
    MODEL_ANSWER: "模型回答",
    APP_CREATE: "创建应用",
    CODE_CHECK: "代码检查",
    CODE_REPAIR: "代码修复",
    SOCIAL_DRAFT: "社交草稿",
    CALENDAR_REMINDER: "日历提醒",
    PREDICTION_RUN: "数列预测",
    WORKSPACE_SAVE: "保存工作区",
    STORE_INSTALL: "能力包安装",
    QA_AUDIT: "QA 审计",
    WORLD_GENERATE: "世界生成",
    MUSIC_CREATE: "音乐创作",
  };
  return map[t] ?? "任务";
}

function needsConfirmDefault(t: AetherTaskType): boolean {
  return t === "SOCIAL_DRAFT" || t === "STORE_INSTALL";
}

function defaultModule(t: AetherTaskType): string {
  const map: Partial<Record<AetherTaskType, string>> = {
    APP_CREATE: "APP_RUNTIME",
    CODE_CHECK: "CODE_SANDBOX",
    CODE_REPAIR: "CODE_SANDBOX",
    SOCIAL_DRAFT: "SOCIAL",
    CALENDAR_REMINDER: "CALENDAR",
    PREDICTION_RUN: "SEQUENCE_PREDICTION",
    WORKSPACE_SAVE: "WORKSPACE",
    STORE_INSTALL: "STORE",
    QA_AUDIT: "QA",
    WORLD_GENERATE: "WORLD_RUNTIME",
    MUSIC_CREATE: "VOCAL",
  };
  return map[t] ?? "CHAT";
}
