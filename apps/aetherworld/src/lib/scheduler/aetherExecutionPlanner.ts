// 执行计划生成器：根据 taskType 生成结构化 ExecutionPlan。
import type {
  AetherTask,
  ExecutionPlan,
  ExecutionStep,
} from "./aetherSchedulerTypes";

let _stepCounter = 0;
function stepId(): string {
  _stepCounter += 1;
  return `STEP-${Date.now().toString(36)}-${_stepCounter}`;
}

function step(
  label: string,
  module: string,
  action: string,
  opts: { requiresConfirmation?: boolean } = {},
): ExecutionStep {
  return {
    id: stepId(),
    label,
    module,
    action,
    status: "PENDING",
    requiresConfirmation: opts.requiresConfirmation ?? false,
  };
}

export function buildExecutionPlan(task: AetherTask): ExecutionPlan {
  const base: ExecutionPlan = {
    id: `PLAN-${task.id}`,
    taskId: task.id,
    steps: [],
    riskLevel: "LOW",
    requiredTools: [],
    expectedOutputs: [],
  };

  switch (task.taskType) {
    case "APP_CREATE":
      return {
        ...base,
        steps: [
          step("解析需求", "APP_RUNTIME", "PARSE_INTENT"),
          step("生成应用骨架", "APP_RUNTIME", "GENERATE_SKELETON"),
          step("生成代码草案", "CODE_SANDBOX", "DRAFT_CODE"),
          step("保存到工作区", "WORKSPACE", "SAVE_OBJECT"),
          step("QA 审计", "QA", "RUN_AUDIT"),
        ],
        riskLevel: "MEDIUM",
        requiredTools: ["APP_RUNTIME", "CODE_SANDBOX", "WORKSPACE"],
        expectedOutputs: ["AppDraftObject", "QAReport"],
      };
    case "CODE_CHECK":
      return {
        ...base,
        steps: [
          step("收集代码", "CODE_SANDBOX", "COLLECT"),
          step("静态检查", "CODE_SANDBOX", "STATIC_CHECK"),
          step("QA 审计", "QA", "RUN_AUDIT"),
        ],
        riskLevel: "LOW",
        requiredTools: ["CODE_SANDBOX"],
        expectedOutputs: ["CodeCheckReport"],
      };
    case "CODE_REPAIR":
      return {
        ...base,
        steps: [
          step("收集错误", "CODE_SANDBOX", "COLLECT_ERRORS"),
          step("生成 Patch", "CODE_SANDBOX", "DRAFT_PATCH"),
          step("静态检查", "CODE_SANDBOX", "STATIC_CHECK"),
          step("QA", "QA", "RUN_AUDIT"),
          step("输出修复卡", "CHAT", "RENDER_CARD"),
        ],
        riskLevel: "MEDIUM",
        requiredTools: ["CODE_SANDBOX", "QA"],
        expectedOutputs: ["PatchDraft", "QAReport"],
      };
    case "SOCIAL_DRAFT":
      return {
        ...base,
        steps: [
          step("获取对象", "WORKSPACE", "FETCH_OBJECT"),
          step("生成发布草稿", "SOCIAL", "DRAFT_POST"),
          step("QA / Safety", "QA", "RUN_AUDIT"),
          step("保存为 PRIVATE", "SOCIAL", "SAVE_PRIVATE"),
          step("等待用户确认公开", "SOCIAL", "PUBLISH", { requiresConfirmation: true }),
        ],
        riskLevel: "HIGH",
        requiredTools: ["SOCIAL", "WORKSPACE", "QA"],
        expectedOutputs: ["SocialDraft"],
        fallbackPlan: "若 QA 不通过，仅保留 PRIVATE 草稿，不进入公开队列。",
      };
    case "CALENDAR_REMINDER":
      return {
        ...base,
        steps: [
          step("解析时间", "CALENDAR", "PARSE_TIME"),
          step("创建日历草稿", "CALENDAR", "CREATE_DRAFT"),
          step("到点触发", "CALENDAR", "TICK_TRIGGER"),
        ],
        riskLevel: "LOW",
        requiredTools: ["CALENDAR"],
        expectedOutputs: ["CalendarTaskDraft"],
      };
    case "PREDICTION_RUN":
      return {
        ...base,
        steps: [
          step("提取变量", "SEQUENCE_PREDICTION", "EXTRACT_VARIABLES"),
          step("生成轨迹", "SEQUENCE_PREDICTION", "PLAN_TRAJECTORIES"),
          step("评估行动许可", "SEQUENCE_PREDICTION", "ACTION_PERMISSION"),
          step("生成复查节点", "CALENDAR", "REVIEW_NODES"),
        ],
        riskLevel: "LOW",
        requiredTools: ["SEQUENCE_PREDICTION", "CALENDAR"],
        expectedOutputs: ["PredictionReport"],
      };
    case "STORE_INSTALL":
      return {
        ...base,
        steps: [
          step("解析能力包", "STORE", "RESOLVE_MANIFEST"),
          step("权限审计", "QA", "PERMISSION_AUDIT"),
          step("等待用户确认", "STORE", "CONFIRM", { requiresConfirmation: true }),
          step("安装", "STORE", "INSTALL"),
        ],
        riskLevel: "HIGH",
        requiredTools: ["STORE", "QA"],
        expectedOutputs: ["InstalledPackage"],
      };
    case "WORKSPACE_SAVE":
      return {
        ...base,
        steps: [
          step("序列化对象", "WORKSPACE", "SERIALIZE"),
          step("保存对象", "WORKSPACE", "SAVE"),
          step("QA", "QA", "RUN_AUDIT"),
        ],
        riskLevel: "LOW",
        requiredTools: ["WORKSPACE"],
        expectedOutputs: ["WorkspaceObject"],
      };
    case "QA_AUDIT":
    case "BUG_AUDIT":
      return {
        ...base,
        steps: [
          step("加载对象", "QA", "LOAD"),
          step("规则检查", "QA", "RULE_CHECK"),
          step("生成报告", "QA", "REPORT"),
        ],
        riskLevel: "LOW",
        requiredTools: ["QA"],
        expectedOutputs: ["QAReport"],
      };
    case "FOLLOW_UP_REVIEW":
      return {
        ...base,
        steps: [
          step("加载预测", "SEQUENCE_PREDICTION", "LOAD"),
          step("生成复查日历", "CALENDAR", "DRAFT_REVIEW"),
        ],
        riskLevel: "LOW",
        requiredTools: ["SEQUENCE_PREDICTION", "CALENDAR"],
        expectedOutputs: ["ReviewDraft"],
      };
    case "MODEL_ANSWER":
    default:
      return {
        ...base,
        steps: [
          step("路由计算法", "CHAT", "ROUTE_CALCULUS"),
          step("调用模型", "CHAT", "CALL_MODEL"),
          step("写入 MSL / 货币 / 记忆", "CHAT", "AUDIT_TRAIL"),
        ],
        riskLevel: "LOW",
        requiredTools: ["CHAT"],
        expectedOutputs: ["ChatAnswer"],
      };
  }
}
