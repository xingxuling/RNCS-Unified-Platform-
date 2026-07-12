import type { WebLlmRunResult } from "./webLlmChatEngine";

export interface SequenceAiWebLlmConfig {
  useWebLlm: boolean;
  webLlmModelId?: string;
  webLlmRuntimeMode: string;
  neuroControlProfile: string;
  fallbackMode: string;
}

export interface SequenceAiWebLlmAttachment {
  webLlmUsed: boolean;
  webLlmRunId?: string;
  webLlmModelId?: string;
  neuroControlProfile: string;
  predictiveErrorStatus?: string;
  fallbackUsed: boolean;
  qaRequired: boolean;
}

export function attachWebLlmToSequenceAi(result: WebLlmRunResult | null, cfg: SequenceAiWebLlmConfig): SequenceAiWebLlmAttachment {
  if (!result) {
    return {
      webLlmUsed: false,
      neuroControlProfile: cfg.neuroControlProfile,
      fallbackUsed: false,
      qaRequired: false,
    };
  }
  return {
    webLlmUsed: true,
    webLlmRunId: result.runId,
    webLlmModelId: result.modelId,
    neuroControlProfile: cfg.neuroControlProfile,
    fallbackUsed: result.fallbackUsed,
    qaRequired: result.qaRequired,
  };
}
