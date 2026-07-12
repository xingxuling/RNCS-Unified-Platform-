import type { WebLlmMessage } from "./webLlmPromptCompiler";

export interface WebLlmRunRequest {
  requestId: string;
  modelId: string;
  runtimeMode: string;
  taskType: string;
  messages: WebLlmMessage[];
  temperature: number;
  maxTokens?: number;
  stream: boolean;
  outputContract: string[];
  createdAt: string;
}

export interface WebLlmRunResult {
  runId: string;
  requestId: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED" | "BLOCKED" | "FALLBACK";
  rawText: string;
  structuredOutput?: Record<string, unknown>;
  qaRequired: boolean;
  neuroControlReport?: Record<string, unknown>;
  safetyNotes: string[];
  createdAt: string;
  modelId: string;
  taskType: string;
  fallbackUsed: boolean;
}

export function newId(prefix = "req"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Generate via WebLLM if available, else return FALLBACK with rule-based stub.
 */
export async function runWebLlmChat(req: WebLlmRunRequest): Promise<WebLlmRunResult> {
  const created = new Date().toISOString();
  // Try real engine — if not loaded / package missing, fallback
  let real = false;
  try {
    const mod = ["@mlc-ai/", "web-llm"].join("");
    // @ts-ignore
    await import(/* @vite-ignore */ mod);
    real = true;
  } catch { real = false; }

  if (!real) {
    const fallbackText = buildFallbackText(req);
    return {
      runId: newId("run"),
      requestId: req.requestId,
      status: "FALLBACK",
      rawText: fallbackText,
      qaRequired: true,
      safetyNotes: ["WebLLM 不可用：已降级为规则层占位输出。"],
      createdAt: created,
      modelId: req.modelId,
      taskType: req.taskType,
      fallbackUsed: true,
    };
  }

  // Real path not wired (engine integration deferred) — return a structured stub
  return {
    runId: newId("run"),
    requestId: req.requestId,
    status: "SUCCESS",
    rawText: "[WebLLM 占位输出] 模型已加载，但本版本尚未启用真实推理路径。",
    qaRequired: true,
    safetyNotes: [],
    createdAt: created,
    modelId: req.modelId,
    taskType: req.taskType,
    fallbackUsed: false,
  };
}

function buildFallbackText(req: WebLlmRunRequest): string {
  const last = req.messages[req.messages.length - 1]?.content || "";
  return `【规则层降级输出】\n任务类型：${req.taskType}\n用户输入摘要：${last.slice(0, 200)}\n建议：按照计算法结构生成草案，并提交 QA 与 System Constitution 检查。`;
}
