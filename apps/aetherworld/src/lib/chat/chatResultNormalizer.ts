import type { ChatDisplayResult, ChatResultAction, ChatDisplayResultType, ChatDisplayResultQa } from "./chatDisplayResultTypes";

let counter = 0;
function newResultId(): string {
  counter += 1;
  return `RES-${Date.now().toString(36)}-${counter}`;
}

/**
 * 标准化任意运行输出为 ChatDisplayResult。
 * 调用方可以提供尽量多的信息，未提供的字段使用合理默认值。
 */
export function normalizeDisplayResult(input: {
  resultType: ChatDisplayResultType;
  title: string;
  summary: string;
  sourceModule: string;
  mainContent?: string;
  structuredPreview?: Record<string, unknown>;
  objectId?: string;
  objectType?: string;
  runId?: string;
  qaStatus?: ChatDisplayResultQa;
  actions?: ChatResultAction[];
}): ChatDisplayResult {
  return {
    resultId: newResultId(),
    resultType: input.resultType,
    title: input.title,
    summary: input.summary,
    mainContent: input.mainContent,
    structuredPreview: input.structuredPreview,
    objectId: input.objectId,
    objectType: input.objectType,
    runId: input.runId,
    qaStatus: input.qaStatus ?? "NOT_CHECKED",
    sourceModule: input.sourceModule,
    actions: input.actions ?? [],
    createdAt: new Date().toISOString(),
  };
}
