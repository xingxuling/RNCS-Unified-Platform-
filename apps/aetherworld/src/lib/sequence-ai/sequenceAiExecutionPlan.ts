// 执行计划构造器：为每个模式准备模块步骤
import type {
  SequenceAiMode,
  SequenceAiExecutionPlan,
  SequenceAiExecutionStep,
  SafetyStatus,
} from "./sequenceAiTypes";

const PLAN_TEMPLATES: Record<SequenceAiMode, { modules: string[]; finalOutputType: string }> = {
  EXPLAIN_SEQUENCE: {
    modules: ["MOTHER_SEQUENCE_CORE", "FIVE_DOMAIN", "CONSTANTS_UNIVERSE", "MSL", "QA_BUG_AUDIT"],
    finalOutputType: "SEQUENCE_EXPLANATION",
  },
  GENERATE_SEQUENCE: {
    modules: ["MOTHER_SEQUENCE_CORE", "FIVE_DOMAIN", "SEQUENCE_OBJECT", "MSL", "WORKSPACE"],
    finalOutputType: "SEQUENCE_DRAFT",
  },
  PREDICT_SEQUENCE: {
    modules: [
      "SEQUENCE_MEMORY",
      "FIVE_DOMAIN",
      "FUSION_RUNTIME",
      "SEQUENCE_PREDICTION",
      "MSL",
      "SEQUENCE_CURRENCY",
      "CALENDAR",
      "WORKSPACE",
    ],
    finalOutputType: "PREDICTION_REPORT",
  },
  COMPRESS_SEQUENCE: {
    modules: ["SEQUENCE_MEMORY", "MSL", "SEQUENCE_CURRENCY"],
    finalOutputType: "SMU",
  },
  VALUE_SEQUENCE: {
    modules: ["ANALYTICS", "SEQUENCE_CURRENCY", "MSL"],
    finalOutputType: "VALUE_REPORT",
  },
  AGENT_SEQUENCE: {
    modules: ["SEQUENCE_AGENT", "MSL", "SEQUENCE_CURRENCY", "QA_BUG_AUDIT"],
    finalOutputType: "AGENT_PANEL",
  },
  STATE_SEQUENCE: {
    modules: ["MSL", "CONSTANTS_UNIVERSE", "SEQUENCE_MEMORY"],
    finalOutputType: "MSL_FRAME",
  },
  WORLD_SEQUENCE: {
    modules: ["WORLD_ENGINE", "MSL", "SEQUENCE_MEMORY", "WORKSPACE"],
    finalOutputType: "WORLD_DRAFT",
  },
};

import { getSequenceAiModule } from "./sequenceAiModuleRegistry";

export function buildExecutionPlan(
  mode: SequenceAiMode,
  safetyStatus: SafetyStatus
): SequenceAiExecutionPlan {
  const tpl = PLAN_TEMPLATES[mode];
  const steps: SequenceAiExecutionStep[] = tpl.modules.map((mid, i) => {
    const mod = getSequenceAiModule(mid);
    const requiresConfirm = mod?.requiresConfirmation;
    const status = safetyStatus === "BLOCK"
      ? "SKIPPED"
      : requiresConfirm
      ? "PENDING"
      : "SUCCESS";
    return {
      id: `step-${i + 1}`,
      moduleId: mid,
      cnName: mod?.cnName ?? mid,
      action: defaultAction(mode, mid),
      status,
      note: requiresConfirm ? "高风险动作，需 Scheduler 待确认" : undefined,
    };
  });
  return {
    id: `PLAN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    mode,
    steps,
    finalOutputType: tpl.finalOutputType,
    safetyStatus,
  };
}

function defaultAction(mode: SequenceAiMode, moduleId: string): string {
  if (moduleId === "SEQUENCE_PREDICTION") return "生成轨迹 / 概率 / 复查节点";
  if (moduleId === "SEQUENCE_MEMORY") return "检索相关 SMU / 压缩本轮上下文";
  if (moduleId === "SEQUENCE_CURRENCY") return "写入价值事件";
  if (moduleId === "MSL") return "生成 MSL 状态帧";
  if (moduleId === "FUSION_RUNTIME") return "跨域融合规划";
  if (moduleId === "FIVE_DOMAIN") return "五域坐标评分";
  if (moduleId === "MOTHER_SEQUENCE_CORE") return "母体数列解码 / 校准";
  if (moduleId === "CONSTANTS_UNIVERSE") return "常数约束校验";
  if (moduleId === "WORKSPACE") return "保存为 SEQUENCE_AI_RESULT";
  if (moduleId === "CALENDAR") return "生成复查节点草案";
  if (moduleId === "SEQUENCE_AGENT") return "多 Agent 评审";
  if (moduleId === "WORLD_ENGINE") return "世界 / 叙事 / 声乐草案";
  if (moduleId === "ANALYTICS") return "聚合运行统计";
  if (moduleId === "QA_BUG_AUDIT") return "QA 校验";
  return `执行 ${moduleId}`;
}
