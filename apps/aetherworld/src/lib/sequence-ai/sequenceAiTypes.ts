// 数列 AI 总调度内核：类型定义
// 注：复用 src/lib/sequence-ai/sequenceAI.ts（已有意图分类 / 引擎计划 / 安全 / 响应），
// 本层在其外部加一层「模块编排 + 模式 + 执行计划 + 跨模块桥接」。
export type SequenceAiMode =
  | "EXPLAIN_SEQUENCE"
  | "GENERATE_SEQUENCE"
  | "PREDICT_SEQUENCE"
  | "COMPRESS_SEQUENCE"
  | "VALUE_SEQUENCE"
  | "AGENT_SEQUENCE"
  | "STATE_SEQUENCE"
  | "WORLD_SEQUENCE";

export const SEQUENCE_AI_MODE_LABEL: Record<SequenceAiMode, string> = {
  EXPLAIN_SEQUENCE: "解释数列",
  GENERATE_SEQUENCE: "生成数列",
  PREDICT_SEQUENCE: "数列预测",
  COMPRESS_SEQUENCE: "数列压缩",
  VALUE_SEQUENCE: "数列计量",
  AGENT_SEQUENCE: "数列 Agent",
  STATE_SEQUENCE: "MSL 状态",
  WORLD_SEQUENCE: "数列世界",
};

export type ModuleStatus = "READY" | "PARTIAL" | "PLACEHOLDER" | "DISABLED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface SequenceAiModule {
  id: string;
  cnName: string;
  status: ModuleStatus;
  callable: boolean;
  inputTypes: string[];
  outputTypes: string[];
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
}

export type StepStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";
export type SafetyStatus = "PASS" | "WARN" | "BLOCK";

export interface SequenceAiExecutionStep {
  id: string;
  moduleId: string;
  cnName: string;
  action: string;
  status: StepStatus;
  outputRef?: string;
  note?: string;
}

export interface SequenceAiExecutionPlan {
  id: string;
  mode: SequenceAiMode;
  steps: SequenceAiExecutionStep[];
  finalOutputType: string;
  safetyStatus: SafetyStatus;
}

export interface SequenceAiResultSummary {
  /** 简短解释 / 结论 */
  conclusion: string;
  /** 关键要点 */
  keyPoints: string[];
  /** 用到的模块 */
  moduleIds: string[];
  /** 风险说明 */
  riskNotes: string[];
  /** 下一步建议 */
  nextActions: string[];
  /** 生成的数列编码（可选） */
  sequenceCode?: string;
  /** MSL 状态行 */
  mslLines: string[];
  /** 估算价值事件计数 */
  valueEventCount: number;
  /** 估算生成的记忆单元数 */
  memoryUnitEstimate: number;
}

export interface SequenceAiRunResult {
  id: string;
  mode: SequenceAiMode;
  modeLabel: string;
  input: string;
  plan: SequenceAiExecutionPlan;
  summary: SequenceAiResultSummary;
  llmUsed: boolean;
  fallbackReason?: string;
  createdAt: string;
}

export function newSequenceAiRunId(): string {
  return `SAIR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
