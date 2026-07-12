import type { WebCapabilityId, WebCapabilityStatus } from "@/constants/web-capability/webCapabilityTypes";
import type { WebCapabilityProcedureStepType } from "@/constants/web-capability/webCapabilityProcedureTypes";
import type { WebCapabilityOutputType } from "@/constants/web-capability/webCapabilityOutputTypes";

export interface WebCapabilityProcedureStep {
  stepId: string;
  type: WebCapabilityProcedureStepType;
  title: string;
  description: string;
}

export interface WebCapabilityModel {
  capabilityId: WebCapabilityId;
  name: string;
  chineseName: string;
  domain: string;
  description: string;
  inputTypes: string[];
  outputTypes: WebCapabilityOutputType[];
  requiredKnowledgeSources: string[];
  requiredCalculusIds: string[];
  requiredConstants: string[];
  toolInterfaces: string[];
  procedureSteps: WebCapabilityProcedureStep[];
  qaRules: string[];
  safetyRules: string[];
  workspaceObjectTypes: string[];
  status: WebCapabilityStatus;
  version: string;
}

export interface WebCapabilityOutput {
  outputId: string;
  outputType: WebCapabilityOutputType;
  title: string;
  summary: string;
  structuredOutput: Record<string, unknown>;
  exportTargets: string[];
  safetyNotes: string[];
}

export interface WebCapabilityQaResult {
  status: "PASS" | "WARN" | "BLOCK";
  warnings: { ruleId: string; message: string; severity: string }[];
}

export interface WebCapabilityRun {
  runId: string;
  capabilityId: WebCapabilityId;
  userTask: string;
  retrievedKnowledgeIds: string[];
  selectedCalculusIds: string[];
  appliedConstantIds: string[];
  conceptChainId?: string;
  webLlmRunId?: string;
  outputs: WebCapabilityOutput[];
  qa: WebCapabilityQaResult;
  qaStatus: string;
  workspaceRecordId?: string;
  blocked?: boolean;
  blockedReasons?: string[];
  createdAt: string;
}

export const DEFAULT_PROCEDURE_STEPS: WebCapabilityProcedureStep[] = [
  { stepId: "S1", type: "RETRIEVE_KNOWLEDGE",   title: "检索领域知识",        description: "调用 WebLKM 获取相关知识与历史项目。" },
  { stepId: "S2", type: "SELECT_CALCULUS",       title: "选择计算法路线",      description: "WebCM 根据任务匹配计算法。" },
  { stepId: "S3", type: "INJECT_CONSTANTS",      title: "注入常数边界",        description: "WebCoM 注入不变量与安全约束。" },
  { stepId: "S4", type: "BUILD_CONCEPT_CHAIN",   title: "生成概念链",          description: "WebLCM 压缩输入为概念链。" },
  { stepId: "S5", type: "RUN_TOOL_INTERFACE",    title: "调用工具接口",        description: "按工具适配器执行所需操作。" },
  { stepId: "S6", type: "EXPAND_WITH_WEBLLM",    title: "WebLLM 展开",         description: "在本地用 WebLLM 展开为自然语言或代码。" },
  { stepId: "S7", type: "PRODUCE_OUTPUT_OBJECT", title: "生成输出对象",        description: "封装为结构化 Output Object。" },
  { stepId: "S8", type: "RUN_QA",                title: "QA 复检",             description: "调用 Software QA 进行多维评估。" },
  { stepId: "S9", type: "SAVE_WORKSPACE",        title: "保存 Workspace",      description: "写入 Workspace 记录以供回溯。" },
];
