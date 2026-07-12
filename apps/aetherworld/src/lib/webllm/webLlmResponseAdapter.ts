import type { WebLlmRunResult } from "./webLlmChatEngine";

export interface AdaptedWebLlmOutput {
  plain: string;
  structured?: Record<string, unknown>;
  qaRequired: boolean;
  notes: string[];
}

export function adaptResponse(result: WebLlmRunResult, outputContract: string[]): AdaptedWebLlmOutput {
  const wantsStructured = outputContract.some((c) => /structured|files|patch|markdown|lyrics|paragraphs|readme/i.test(c));
  let structured: Record<string, unknown> | undefined;
  if (wantsStructured) {
    structured = { taskType: result.taskType, modelId: result.modelId, sections: [{ title: "draft", body: result.rawText }] };
  }
  return {
    plain: result.rawText,
    structured,
    qaRequired: result.qaRequired,
    notes: result.safetyNotes,
  };
}
