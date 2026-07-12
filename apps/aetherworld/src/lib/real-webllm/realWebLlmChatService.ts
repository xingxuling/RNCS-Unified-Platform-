// 真实 chat completion：非流式 + 流式 + 取消 + QA + Workspace
import {
  getEngine,
  getRuntimeState,
  markGenerating,
  markReady,
  markError,
} from "./realWebLlmEngineManager";
import { beginAbortable, clearAbort, shouldStop } from "./realWebLlmAbortController";
import { compileRealWebLlmPrompt, type CompiledPromptInput } from "./realWebLlmPromptCompiler";
import { checkRealWebLlmOutput, type QaStatus } from "./realWebLlmQaBridge";
import { saveRealWebLlmRun } from "./realWebLlmWorkspaceBridge";

export interface RealWebLlmRunRequest {
  requestId: string;
  taskType: string;
  sourceModule: string;
  prompt: CompiledPromptInput;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface RealWebLlmRunResult {
  runId: string;
  requestId: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED" | "BLOCKED" | "FALLBACK";
  text: string;
  qaStatus: QaStatus;
  safetyNotes: string[];
  latencyMs: number;
  createdAt: string;
}

export interface StreamHandlers {
  onDelta?: (chunk: string, full: string) => void;
  onDone?: (result: RealWebLlmRunResult) => void;
  onError?: (err: string) => void;
}

function newRunId() {
  return "rwl_run_" + Math.random().toString(36).slice(2, 10);
}

function packageResult(
  runId: string,
  requestId: string,
  text: string,
  partial: boolean,
  start: number,
): RealWebLlmRunResult {
  const qa = checkRealWebLlmOutput(text);
  let status: RealWebLlmRunResult["status"] =
    qa.status === "BLOCKED" ? "BLOCKED" : partial ? "PARTIAL" : "SUCCESS";
  return {
    runId,
    requestId,
    status,
    text: qa.status === "BLOCKED" ? "" : text,
    qaStatus: qa.status,
    safetyNotes: qa.notes,
    latencyMs: Date.now() - start,
    createdAt: new Date().toISOString(),
  };
}

export async function runRealWebLlmChat(
  req: RealWebLlmRunRequest,
  handlers: StreamHandlers = {},
): Promise<RealWebLlmRunResult> {
  const rt = getRuntimeState();
  const runId = newRunId();
  const start = Date.now();
  const engine = getEngine();

  if (!engine || rt.engineStatus !== "READY") {
    const errMsg = "本地模型尚未就绪，请先加载模型。";
    const fallback: RealWebLlmRunResult = {
      runId,
      requestId: req.requestId,
      status: "FALLBACK",
      text: "",
      qaStatus: "NOT_CHECKED",
      safetyNotes: [errMsg],
      latencyMs: 0,
      createdAt: new Date().toISOString(),
    };
    handlers.onError?.(errMsg);
    return fallback;
  }

  const messages = compileRealWebLlmPrompt(req.prompt);
  beginAbortable();
  markGenerating(runId);

  try {
    if (req.stream) {
      let full = "";
      const stream = await engine.chat.completions.create({
        messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 512,
        stream: true,
      });
      for await (const chunk of stream as any) {
        if (shouldStop()) break;
        const delta = chunk?.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          handlers.onDelta?.(delta, full);
        }
      }
      const partial = shouldStop();
      const result = packageResult(runId, req.requestId, full, partial, start);
      saveRealWebLlmRun({
        runId,
        sourceModule: req.sourceModule,
        modelId: rt.selectedModelId ?? "",
        taskType: req.taskType,
        status: result.status,
        textPreview: result.text,
        qaStatus: result.qaStatus,
      });
      markReady();
      clearAbort();
      handlers.onDone?.(result);
      return result;
    }

    const resp = await engine.chat.completions.create({
      messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 512,
    });
    const text = resp?.choices?.[0]?.message?.content ?? "";
    const result = packageResult(runId, req.requestId, text, false, start);
    saveRealWebLlmRun({
      runId,
      sourceModule: req.sourceModule,
      modelId: rt.selectedModelId ?? "",
      taskType: req.taskType,
      status: result.status,
      textPreview: result.text,
      qaStatus: result.qaStatus,
    });
    markReady();
    clearAbort();
    handlers.onDone?.(result);
    return result;
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    markError(msg);
    clearAbort();
    handlers.onError?.(msg);
    return {
      runId,
      requestId: req.requestId,
      status: "FAILED",
      text: "",
      qaStatus: "FAIL",
      safetyNotes: [msg],
      latencyMs: Date.now() - start,
      createdAt: new Date().toISOString(),
    };
  }
}
