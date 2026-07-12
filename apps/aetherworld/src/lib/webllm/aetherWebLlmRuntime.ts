import { DEFAULT_WEB_LLM_RUNTIME_MODE, type WebLlmRuntimeModeId } from "@/constants/webllm/webLlmRuntimeModes";
import { DEFAULT_WEB_LLM_MODEL_ID } from "@/constants/webllm/webLlmModelPresets";
import { DEFAULT_NEURO_CONTROL_PROFILE_ID } from "@/constants/webllm/webLlmNeuroControlProfiles";
import { availabilitySync, detectWebLlmAvailability, type WebLlmAvailability } from "./webLlmAvailabilityDetector";
import { buildKnowledgeSummary } from "./webLlmKnowledgeBinder";
import { buildPersonalitySummary } from "./webLlmPersonalityBinder";
import { compilePrompt, previewPrompt, type WebLlmPromptContext } from "./webLlmPromptCompiler";
import { runWebLlmChat, newId, type WebLlmRunRequest, type WebLlmRunResult } from "./webLlmChatEngine";
import { evaluateWebLlmSafety } from "./webLlmSafetyGuard";
import { ruleOnlyFallback } from "./webLlmFallbackEngine";
import { applyNeuroControl, type NeuroControlReport } from "./webLlmNeuroControlLayer";
import { runPredictiveErrorGate, type PredictiveErrorReport } from "./webLlmPredictiveErrorGate";
import { checkLocalDetail, type LocalDetailReport } from "./webLlmLocalDetailFocusEngine";
import { runExecutiveGate, type ExecutiveGateReport } from "./webLlmExecutiveGate";
import { runWebLlmQa, type WebLlmQaResult } from "./webLlmQaBridge";
import { saveWebLlmRunToWorkspace } from "./webLlmWorkspaceBridge";
import { WEB_LLM_SAFETY_FOOTER } from "@/constants/webllm/webLlmSafetyRules";

export interface RunWebLlmOptions {
  userInput: string;
  modelId?: string;
  runtimeMode?: WebLlmRuntimeModeId;
  taskType?: string;
  neuroControlProfile?: string;
  subjectMode?: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
  outputContract?: string[];
  saveToWorkspace?: boolean;
}

export interface WebLlmRuntimeResult {
  availability: WebLlmAvailability;
  request: WebLlmRunRequest;
  promptPreview: string;
  result: WebLlmRunResult;
  neuroControl: NeuroControlReport;
  predictiveError: PredictiveErrorReport;
  localDetail: LocalDetailReport;
  executiveGate: ExecutiveGateReport;
  qa: WebLlmQaResult;
  workspaceRecordId?: string;
  safetyFooter: string;
}

export async function runAetherWebLlm(opts: RunWebLlmOptions): Promise<WebLlmRuntimeResult> {
  const availability = await detectWebLlmAvailability();
  const runtimeMode: WebLlmRuntimeModeId = !availability.webGpuSupported
    ? "NO_WEBGPU_FALLBACK"
    : (opts.runtimeMode ?? DEFAULT_WEB_LLM_RUNTIME_MODE);

  const taskType = opts.taskType ?? "SEQUENCE_AI_CHAT";
  const profile = opts.neuroControlProfile ?? DEFAULT_NEURO_CONTROL_PROFILE_ID;
  const modelId = opts.modelId ?? DEFAULT_WEB_LLM_MODEL_ID;

  const promptCtx: WebLlmPromptContext = {
    taskType,
    subjectMode: opts.subjectMode ?? "DEMO",
    subjectPersonalitySummary: buildPersonalitySummary(opts.subjectMode ?? "DEMO") as unknown as Record<string, unknown>,
    knowledgeSummary: buildKnowledgeSummary() as unknown as Record<string, unknown>,
    calculusStructure: { primary: taskType, version: "v0.3" },
    objectInputs: [],
    neuroControlProfile: profile,
    systemConstitutionRules: [
      "WebLLM 不取代计算法。",
      "草案必须经 QA。",
      "不混淆 Demo / Real。",
      "不公开 Full60 原始数列。",
    ],
    outputContract: opts.outputContract ?? ["plain"],
    forbiddenContent: ["Full60 原始数列", "Founder-only 原文", "密钥/Token/密码"],
  };

  const messages = compilePrompt(promptCtx, opts.userInput);
  const promptPreviewText = previewPrompt(promptCtx, opts.userInput);

  const request: WebLlmRunRequest = {
    requestId: newId("req"),
    modelId,
    runtimeMode,
    taskType,
    messages,
    temperature: 0.5,
    stream: false,
    outputContract: promptCtx.outputContract,
    createdAt: new Date().toISOString(),
  };

  // Safety check on prompt before sending
  const safety = evaluateWebLlmSafety({ messages });
  let result: WebLlmRunResult;
  if (safety.blocked) {
    result = {
      runId: newId("run"),
      requestId: request.requestId,
      status: "BLOCKED",
      rawText: "【安全守卫拦截】检测到禁止字段，已阻止本次 WebLLM 调用。",
      qaRequired: true,
      safetyNotes: safety.violations.map((v) => v.message),
      createdAt: new Date().toISOString(),
      modelId,
      taskType,
      fallbackUsed: false,
    };
  } else if (runtimeMode === "NO_WEBGPU_FALLBACK" || runtimeMode === "RULE_ONLY") {
    const fb = ruleOnlyFallback(taskType, opts.userInput, runtimeMode === "NO_WEBGPU_FALLBACK" ? "WebGPU 不可用" : "用户选择规则层");
    result = {
      runId: newId("run"),
      requestId: request.requestId,
      status: "FALLBACK",
      rawText: fb.rawText,
      qaRequired: true,
      safetyNotes: fb.notes,
      createdAt: new Date().toISOString(),
      modelId,
      taskType,
      fallbackUsed: true,
    };
  } else {
    result = await runWebLlmChat(request);
  }

  const neuroControl = applyNeuroControl(profile, result.rawText, opts.userInput);
  const predictiveError = runPredictiveErrorGate(result.runId, result.rawText, opts.userInput);
  const localDetail = checkLocalDetail(result.rawText, []);
  const executiveGate = runExecutiveGate(taskType, result.rawText);
  const qa = runWebLlmQa(result);

  let workspaceRecordId: string | undefined;
  if (opts.saveToWorkspace !== false) {
    const rec = saveWebLlmRunToWorkspace(request, result, profile, qa.status);
    workspaceRecordId = rec.recordId;
  }

  return {
    availability,
    request,
    promptPreview: promptPreviewText,
    result,
    neuroControl,
    predictiveError,
    localDetail,
    executiveGate,
    qa,
    workspaceRecordId,
    safetyFooter: WEB_LLM_SAFETY_FOOTER,
  };
}

export function snapshotAvailability(): WebLlmAvailability {
  return availabilitySync();
}
