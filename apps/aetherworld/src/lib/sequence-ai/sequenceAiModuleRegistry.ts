// 数列 AI 模块登记表：声明 Sequence AI 可以调用的子模块及其状态
import type { SequenceAiModule } from "./sequenceAiTypes";

export const SEQUENCE_AI_MODULE_REGISTRY: SequenceAiModule[] = [
  { id: "MOTHER_SEQUENCE_CORE", cnName: "母体数列核心", status: "READY", callable: true, inputTypes: ["状态"], outputTypes: ["sequenceCode"], riskLevel: "MEDIUM", requiresConfirmation: false },
  { id: "MSL", cnName: "数列状态语言 MSL", status: "READY", callable: true, inputTypes: ["事件"], outputTypes: ["MSLStateFrame"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "SEQUENCE_OBJECT", cnName: "数列对象", status: "READY", callable: true, inputTypes: ["定义"], outputTypes: ["SequenceObject"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "SEQUENCE_MEMORY", cnName: "数列记忆", status: "READY", callable: true, inputTypes: ["上下文"], outputTypes: ["SMU"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "SEQUENCE_CURRENCY", cnName: "数列货币", status: "READY", callable: true, inputTypes: ["运行事件"], outputTypes: ["ledgerEntry"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "SEQUENCE_PREDICTION", cnName: "数列预测", status: "READY", callable: true, inputTypes: ["对象"], outputTypes: ["trajectories", "reviewNodes"], riskLevel: "HIGH", requiresConfirmation: false },
  { id: "SEQUENCE_AGENT", cnName: "数列 Agent", status: "READY", callable: true, inputTypes: ["问题"], outputTypes: ["AgentPanel"], riskLevel: "MEDIUM", requiresConfirmation: false },
  { id: "FUSION_RUNTIME", cnName: "跨域融合运行时", status: "READY", callable: true, inputTypes: ["五域"], outputTypes: ["FusionPlan"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "CONSTANTS_UNIVERSE", cnName: "常数宇宙", status: "READY", callable: true, inputTypes: ["枚举"], outputTypes: ["enumValid"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "FIVE_DOMAIN", cnName: "五域坐标", status: "READY", callable: true, inputTypes: ["对象"], outputTypes: ["domainScore"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "WEBLCM_GRAPH", cnName: "WebLCM 概念图", status: "PARTIAL", callable: true, inputTypes: ["概念"], outputTypes: ["graphEdge"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "WORKSPACE", cnName: "工作区", status: "READY", callable: true, inputTypes: ["对象"], outputTypes: ["WorkspaceObject"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "CALENDAR", cnName: "触发日历", status: "READY", callable: true, inputTypes: ["复查节点"], outputTypes: ["CalendarTask"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "SCHEDULER", cnName: "调度运行时", status: "READY", callable: true, inputTypes: ["任务草案"], outputTypes: ["AetherTask"], riskLevel: "MEDIUM", requiresConfirmation: true },
  { id: "QA_BUG_AUDIT", cnName: "QA / Bug 审计", status: "READY", callable: true, inputTypes: ["结果"], outputTypes: ["qaStatus"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "ANALYTICS", cnName: "运行统计", status: "READY", callable: true, inputTypes: ["事件"], outputTypes: ["agg"], riskLevel: "LOW", requiresConfirmation: false },
  { id: "STORE_WEBXXM", cnName: "能力商店", status: "PARTIAL", callable: false, inputTypes: ["能力包"], outputTypes: ["install"], riskLevel: "HIGH", requiresConfirmation: true },
  { id: "WORLD_ENGINE", cnName: "数列世界 / 世界引擎", status: "READY", callable: true, inputTypes: ["世界需求"], outputTypes: ["WorldDraft"], riskLevel: "MEDIUM", requiresConfirmation: false },
  { id: "APP_RUNTIME", cnName: "应用运行时", status: "READY", callable: true, inputTypes: ["应用需求"], outputTypes: ["AppDraft"], riskLevel: "MEDIUM", requiresConfirmation: true },
  { id: "CODE_SANDBOX", cnName: "代码沙箱", status: "PARTIAL", callable: true, inputTypes: ["代码需求"], outputTypes: ["PatchDraft"], riskLevel: "HIGH", requiresConfirmation: true },
];

export function getSequenceAiModule(id: string): SequenceAiModule | undefined {
  return SEQUENCE_AI_MODULE_REGISTRY.find((m) => m.id === id);
}

export function listCallableModules(): SequenceAiModule[] {
  return SEQUENCE_AI_MODULE_REGISTRY.filter((m) => m.callable);
}
