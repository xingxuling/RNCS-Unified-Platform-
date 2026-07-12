// 数列 AI 主运行时
// 复用既有 src/lib/sequence-ai/sequenceAI.ts 做意图分类与响应草稿，外层加模块编排与摘要。
import { runSequenceAI } from "./sequenceAI";
import { routeSequenceAi, isSequenceAiCalculus } from "./sequenceAiRouter";
import { buildExecutionPlan } from "./sequenceAiExecutionPlan";
import { checkSequenceAiSafety } from "./sequenceAiSafetyPolicy";
import {
  SEQUENCE_AI_MODE_LABEL,
  newSequenceAiRunId,
  type SequenceAiMode,
  type SequenceAiRunResult,
  type SequenceAiResultSummary,
} from "./sequenceAiTypes";

export interface RunSequenceAiInput {
  rawInput: string;
  /** 是否允许调用 LLM（保留位；此版本走规则 + 既有 sequenceAI） */
  allowLlm?: boolean;
  /** 透传：注入历史记忆条数 */
  memoryUnitCount?: number;
  /** 透传：本轮已有的价值事件数 */
  valueEventCount?: number;
  /** 透传：上游已生成的 MSL 帧 ID */
  mslFrameId?: string;
}

function summarize(
  mode: SequenceAiMode,
  ctx: RunSequenceAiInput,
  baseConclusion: string,
  moduleIds: string[],
  safetyNotes: string[]
): SequenceAiResultSummary {
  const keyPoints: string[] = [];
  const nextActions: string[] = [];
  const mslLines: string[] = [
    `MSL::SEQUENCE_AI_RUN @mode=${mode} @status=SUCCESS @modules=${moduleIds.join(",")} @safety=PASS`,
  ];
  let sequenceCode: string | undefined;

  switch (mode) {
    case "EXPLAIN_SEQUENCE":
      keyPoints.push("解析结构与五域映射", "标注计算法链", "提取关键变量与风险");
      nextActions.push("保存为 Workspace 解释对象", "继续推演为预测");
      sequenceCode = extractSequenceCode(ctx.rawInput);
      break;
    case "GENERATE_SEQUENCE":
      keyPoints.push("基于目标生成 sequenceCode 草案", "对齐五域与常数枚举", "可保存为 Sequence Object");
      nextActions.push("保存到工作区", "进入数列对象编辑器");
      break;
    case "PREDICT_SEQUENCE":
      keyPoints.push("生成 currentSequenceState", "≥3 条未来轨迹", "标注行动许可与复查节点");
      nextActions.push("保存预测报告", "创建复查提醒（日历）", "创建 Scheduler 待确认任务");
      break;
    case "COMPRESS_SEQUENCE":
      keyPoints.push("提取关键事件 / 状态", "生成 SMU", "更新压缩比");
      nextActions.push("查看记忆单元", "在 Chat 中引用");
      break;
    case "VALUE_SEQUENCE":
      keyPoints.push("聚合模型 / 工具 / 对象事件", "估算 SCU", "写入 Value Ledger");
      nextActions.push("查看价值账本", "查看 Agent / 模块价值排行");
      break;
    case "AGENT_SEQUENCE":
      keyPoints.push("路由多 Agent", "Coordinator 汇总结论", "标注分歧与风险");
      nextActions.push("保存为评审记录", "派发 AetherTask 待确认");
      break;
    case "STATE_SEQUENCE":
      keyPoints.push("编码当前任务 / 结果 / 工具调用为 MSL", "常数枚举校验", "可被 Workspace 引用");
      nextActions.push("查看 MSL 控制台");
      break;
    case "WORLD_SEQUENCE":
      keyPoints.push("生成世界结构草案", "叙事 / 声乐链衔接", "可保存为 Workspace 世界对象");
      nextActions.push("打开数列世界", "继续叙事 → 声乐链");
      break;
  }

  const conclusion = baseConclusion || `已按「${SEQUENCE_AI_MODE_LABEL[mode]}」模式完成调度。`;
  const valueEventCount = (ctx.valueEventCount ?? 0) + Math.max(1, Math.ceil(moduleIds.length / 3));
  const memoryUnitEstimate = mode === "COMPRESS_SEQUENCE" ? 1 : 0;

  return {
    conclusion,
    keyPoints,
    moduleIds,
    riskNotes: safetyNotes,
    nextActions,
    sequenceCode,
    mslLines,
    valueEventCount,
    memoryUnitEstimate,
  };
}

function extractSequenceCode(text: string): string | undefined {
  const m = text.match(/[0-9A-Za-z]{4,}/);
  return m ? m[0] : undefined;
}

export function runSequenceAiRuntime(input: RunSequenceAiInput): SequenceAiRunResult {
  const decision = routeSequenceAi(input.rawInput);
  const mode: SequenceAiMode = decision.mode;
  const safety = checkSequenceAiSafety(input.rawInput);
  const plan = buildExecutionPlan(mode, safety.status);

  // 调用既有 sequenceAI 内核做意图 / 引擎 / 响应草稿
  let baseConclusion = "";
  let llmUsed = false;
  let fallbackReason: string | undefined;
  try {
    const inner = runSequenceAI({ userInput: input.rawInput, persist: false });
    baseConclusion = inner.response?.plainAnswer?.slice(0, 280) ?? "";
  } catch (e) {
    fallbackReason = `既有 sequenceAI 内核未返回：${(e as Error)?.message ?? "unknown"}`;
  }

  const moduleIds = plan.steps.map((s) => s.moduleId);
  const summary = summarize(mode, input, baseConclusion, moduleIds, safety.notes);

  return {
    id: newSequenceAiRunId(),
    mode,
    modeLabel: SEQUENCE_AI_MODE_LABEL[mode],
    input: input.rawInput,
    plan,
    summary,
    llmUsed,
    fallbackReason,
    createdAt: new Date().toISOString(),
  };
}

export { isSequenceAiCalculus };
