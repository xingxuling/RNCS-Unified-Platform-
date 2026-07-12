import type { AppProjectObject } from "@/lib/app-runtime/appProjectObjectEngine";
import type { CodeSandboxMode } from "@/constants/code-sandbox/codeSandboxModes";
import type {
  CodeRunRequest, CodeRunResult, CodeRunTargetFile,
} from "./codeRunRequestEngine";
import { createRequestId, createRunId, nowIso } from "./codeRunRequestEngine";
import { resolveSandboxMode } from "./codeSandboxModeResolver";
import { evaluateCodeSandboxSafety } from "./codeSandboxSafetyGuard";
import { runStaticHtml } from "./staticHtmlRunner";
import { runSimulatedBuild } from "./simulatedBuildRunner";
import { detectErrors, summarizeErrors } from "./codeErrorDetector";
import { generateRepairSuggestions } from "./codeRepairSuggestionEngine";
import { generatePatchDrafts } from "./codePatchDraftEngine";
import { generateCodexRepairPack, generateCursorRepairPack } from "./externalCodexRunner";
import { runCodeSandboxQa } from "./codeSandboxQaBridge";
import { saveCodeRunToWorkspace, persistCodeRunResult } from "./codeSandboxWorkspaceBridge";
import { buildVersionImpact } from "./codeSandboxVersionBridge";
import type { CodeRunFileRole } from "@/constants/code-sandbox/codeSandboxRunnerTypes";

function detectRole(path: string): CodeRunFileRole {
  if (path.endsWith("index.html")) return "ENTRY";
  if (path === "src/main.tsx" || path === "src/App.tsx") return "ENTRY";
  if (path.endsWith(".css")) return "STYLE";
  if (path.endsWith("package.json") || path.endsWith("vite.config.ts")) return "CONFIG";
  if (/readme/i.test(path)) return "README";
  if (/\.(test|spec)\./.test(path)) return "TEST";
  if (path.endsWith(".tsx") || path.endsWith(".ts") || path.endsWith(".js")) return "SCRIPT";
  return "OTHER";
}

function projectToTargetFiles(project: AppProjectObject): CodeRunTargetFile[] {
  return project.codeFiles.map((f) => ({
    path: f.path,
    language: f.language,
    content: f.content,
    role: detectRole(f.path),
  }));
}

export interface RunCodeSandboxOptions {
  runnerMode?: CodeSandboxMode;
  requestedCommand?: string;
  runPurpose?: string;
  saveToWorkspace?: boolean;
}

export function buildCodeRunRequest(project: AppProjectObject, opts: RunCodeSandboxOptions = {}): CodeRunRequest {
  const runnerMode = resolveSandboxMode(project, opts.runnerMode);
  return {
    requestId: createRequestId(),
    projectId: project.projectId,
    source: "APP_RUNTIME",
    runnerMode,
    targetFiles: projectToTargetFiles(project),
    requestedCommand: opts.requestedCommand,
    runPurpose: opts.runPurpose || "对 App Runtime 草案进行受控运行",
    createdAt: nowIso(),
    safetyNotes: ["v0.2 默认模拟执行，不写入本地", "命令将经过黑白名单与安全守卫"],
  };
}

export function runCodeSandbox(project: AppProjectObject, opts: RunCodeSandboxOptions = {}): CodeRunResult {
  const request = buildCodeRunRequest(project, opts);
  const safety = evaluateCodeSandboxSafety({
    runnerMode: request.runnerMode,
    requestedCommand: request.requestedCommand,
    fileContents: request.targetFiles.map((f) => f.content),
  });

  const baseResult: CodeRunResult = {
    runId: createRunId(),
    requestId: request.requestId,
    projectId: project.projectId,
    runnerMode: request.runnerMode,
    status: "SIMULATED",
    startedAt: nowIso(),
    logs: [],
    repairSuggestions: [],
    patchDrafts: [],
    safetyNotes: [...request.safetyNotes, ...safety.notes],
  };

  if (safety.blocked) {
    baseResult.status = "BLOCKED";
    baseResult.logs = [{
      logId: "log-block", level: "SYSTEM", source: "safety-guard",
      message: `运行已阻断：${safety.notes.join("；")}`, timestamp: nowIso(),
    }];
    baseResult.finishedAt = nowIso();
    baseResult.qaResult = runCodeSandboxQa(baseResult);
    if (opts.saveToWorkspace !== false) {
      const record = saveCodeRunToWorkspace(baseResult);
      baseResult.workspaceRecordId = record.recordId;
      persistCodeRunResult(baseResult);
    }
    return baseResult;
  }

  if (request.runnerMode === "STATIC_HTML_RUNNER") {
    const out = runStaticHtml(request.targetFiles);
    baseResult.logs = out.logs;
    baseResult.status = out.status;
    baseResult.previewHtml = out.previewHtml;
  } else if (request.runnerMode === "SIMULATED_BUILD_RUNNER") {
    const out = runSimulatedBuild(request.targetFiles, request.requestedCommand);
    baseResult.logs = out.logs;
    baseResult.status = out.status;
  } else if (request.runnerMode === "EXTERNAL_CODEX_RUNNER" || request.runnerMode === "EXTERNAL_CURSOR_RUNNER") {
    baseResult.status = "SIMULATED";
    baseResult.logs = [{
      logId: "log-ext", level: "SYSTEM", source: "external-runner",
      message: `生成外部 ${request.runnerMode} 修复包，不执行真实命令。`, timestamp: nowIso(),
    }];
  } else {
    baseResult.status = "BLOCKED";
    baseResult.logs = [{ logId: "log-future", level: "SYSTEM", source: "future-sandbox", message: "Real sandbox execution is reserved for future version.", timestamp: nowIso() }];
  }

  const errors = detectErrors(request.targetFiles, request.runnerMode);
  baseResult.errorSummary = summarizeErrors(errors);
  if (errors.length > 0 && baseResult.status === "PASS") baseResult.status = "WARN";
  if (errors.some((e) => e.severity === "HIGH" || e.severity === "CRITICAL") && baseResult.status !== "BLOCKED") {
    baseResult.status = "FAIL";
  }
  baseResult.repairSuggestions = generateRepairSuggestions(errors);
  baseResult.patchDrafts = generatePatchDrafts(baseResult.repairSuggestions);

  const projectSummary = `${project.projectName} · ${project.intentSummary}`;
  if (request.runnerMode === "EXTERNAL_CODEX_RUNNER" || baseResult.status === "FAIL") {
    baseResult.codexPack = generateCodexRepairPack({
      projectName: project.projectName,
      projectSummary,
      files: request.targetFiles,
      errorSummary: baseResult.errorSummary,
    });
  }
  if (request.runnerMode === "EXTERNAL_CURSOR_RUNNER" || baseResult.status === "FAIL") {
    baseResult.cursorPack = generateCursorRepairPack({
      projectName: project.projectName,
      files: request.targetFiles,
      errorSummary: baseResult.errorSummary,
    });
  }

  baseResult.finishedAt = nowIso();
  baseResult.qaResult = runCodeSandboxQa(baseResult);
  baseResult.versionImpact = buildVersionImpact(baseResult).releaseType;

  if (opts.saveToWorkspace !== false) {
    const record = saveCodeRunToWorkspace(baseResult);
    baseResult.workspaceRecordId = record.recordId;
    persistCodeRunResult(baseResult);
  }
  return baseResult;
}
