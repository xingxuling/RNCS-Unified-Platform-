/**
 * Calculus Bridge — WebLLM is a language organ, not a substitute for calculi.
 * Provides a thin contract for calculi to request natural-language completion
 * from WebLLM while preserving structure.
 */
export interface CalculusCompletionRequest {
  calculusId: string;
  structure: Record<string, unknown>;
  userIntent: string;
  expectedOutputContract: string[];
}

export interface CalculusCompletionPlan {
  calculusId: string;
  shouldUseWebLlm: boolean;
  taskType: string;
  outputContract: string[];
  notes: string[];
}

export function planCalculusCompletion(req: CalculusCompletionRequest): CalculusCompletionPlan {
  return {
    calculusId: req.calculusId,
    shouldUseWebLlm: true,
    taskType: "GENERIC",
    outputContract: req.expectedOutputContract,
    notes: ["WebLLM 仅做语言层补全；结构以计算法为准。"],
  };
}
