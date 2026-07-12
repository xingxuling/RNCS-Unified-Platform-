import { normalizeAppIdea, type AppIdeaInput } from "./appIdeaNormalizer";
import { classifyAppIntent, type AppIntentResult } from "./appIntentClassifier";
import { generateAppRequirement } from "./appRequirementEngine";
import { generateAppArchitecture } from "./appArchitectureEngine";
import { generateAppFileTree } from "./appFileTreeEngine";
import { generateAppCodeDraft } from "./appCodeDraftEngine";
import { generateAppPreview } from "./appPreviewEngine";
import { runAppQa } from "./appQaBridge";
import { saveAppProjectToWorkspace } from "./appWorkspaceBridge";
import { generateAppExportPackage } from "./appExportEngine";
import { generateHandoffPack } from "./appHandoffPackEngine";
import { createTrace, type AppRuntimeTraceEntry } from "./appRuntimeTraceEngine";
import { checkAppRuntimeSafety } from "./appRuntimeSafetyGuard";
import { createAppProjectId, type AppProjectObject } from "./appProjectObjectEngine";

export interface AppRuntimeRunOptions {
  saveToWorkspace?: boolean;
  exportTargets?: ("MARKDOWN_SPEC" | "SINGLE_HTML_FILE" | "CODEX_HANDOFF_PACK")[];
  handoffTargets?: ("CODEX" | "CURSOR" | "LOVABLE")[];
}

export interface AppRuntimeRunResult {
  project: AppProjectObject;
  idea: AppIdeaInput;
  intent: AppIntentResult;
  trace: AppRuntimeTraceEntry[];
  safetyOk: boolean;
}

export function runAetherAppRuntime(rawIdea: string, opts: AppRuntimeRunOptions = {}): AppRuntimeRunResult {
  const trace = createTrace();
  trace.add("normalize", "标准化 App 想法");
  const idea = normalizeAppIdea(rawIdea);

  trace.add("classify", "识别应用类型与运行时模式");
  const intent = classifyAppIntent(rawIdea);

  const projectId = createAppProjectId();
  const name = idea.appNameSuggestion || "Aether App";

  trace.add("requirement", "Digital Product Manager 生成需求");
  const requirement = generateAppRequirement(projectId, idea, intent);

  trace.add("architecture", "Digital Architect 生成架构");
  const architecture = generateAppArchitecture(projectId, requirement, intent.runtimeModeRecommendation);

  trace.add("filetree", "Digital Programmer 生成文件树");
  const fileTree = generateAppFileTree(projectId, architecture);

  trace.add("code", "Digital Programmer 生成代码草案");
  const codeFiles = generateAppCodeDraft(projectId, name, requirement, architecture, fileTree);

  const now = new Date().toISOString();
  const project: AppProjectObject = {
    projectId,
    projectName: name,
    appType: intent.appType,
    appRuntimeMode: intent.runtimeModeRecommendation,
    sourceInput: rawIdea,
    intentSummary: intent.reason,
    targetUsers: requirement.targetUsers,
    coreValue: requirement.productSummary,
    mvpScope: requirement.mvpFeatures.map(f => f.title),
    featureList: requirement.mvpFeatures,
    architecture,
    fileTree,
    codeFiles,
    requirement,
    exportPackages: [],
    handoffPacks: [],
    version: "0.1.0",
    status: "DRAFT",
    safetyNotes: [],
    createdAt: now,
    updatedAt: now,
  };

  trace.add("preview", "生成预览配置");
  project.previewConfig = generateAppPreview(project);
  project.status = project.previewConfig.previewMode === "IFRAME_HTML" ? "PREVIEW_READY" : "DRAFT";

  trace.add("qa", "运行 App QA");
  project.qaResult = runAppQa(project);
  if (project.qaResult.status === "FAIL") project.status = "QA_FAIL";
  else if (project.qaResult.status === "WARN") project.status = "QA_WARN";

  trace.add("safety", "检查安全边界");
  const safety = checkAppRuntimeSafety(project);
  project.safetyNotes = safety.notes;

  const exportTargets = opts.exportTargets || ["MARKDOWN_SPEC", "SINGLE_HTML_FILE", "CODEX_HANDOFF_PACK"];
  for (const t of exportTargets) {
    project.exportPackages.push(generateAppExportPackage(project, t));
  }
  trace.add("export", `生成 ${exportTargets.length} 个导出包`);

  const handoffTargets = opts.handoffTargets || ["CODEX", "CURSOR", "LOVABLE"];
  for (const t of handoffTargets) {
    project.handoffPacks.push(generateHandoffPack(project, t));
  }
  trace.add("handoff", `生成 ${handoffTargets.length} 个 Handoff Pack`);

  if (opts.saveToWorkspace !== false) {
    const rec = saveAppProjectToWorkspace(project);
    project.workspaceRecordId = rec.recordId;
    trace.add("workspace", "保存至 Workspace");
  }

  if (project.status === "DRAFT" && project.exportPackages.length > 0) project.status = "EXPORTED";

  return { project, idea, intent, trace: trace.toArray(), safetyOk: safety.ok };
}
