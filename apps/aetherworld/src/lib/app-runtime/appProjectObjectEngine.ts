import type { AppType } from "@/constants/app-runtime/appTypes";
import type { AppRuntimeMode } from "@/constants/app-runtime/appRuntimeModes";
import type { AppFrameworkTarget } from "@/constants/app-runtime/appFrameworkTargets";
import type { AppExportTarget } from "@/constants/app-runtime/appExportTargets";
import type { AppHandoffTarget } from "@/constants/app-runtime/appHandoffTargets";

export interface AppFeature {
  featureId: string;
  title: string;
  description: string;
  priority: "MUST" | "SHOULD" | "COULD" | "WONT";
  userValue: string;
  acceptanceCriteria: string[];
}

export interface AppPage {
  pageId: string;
  route: string;
  title: string;
  purpose: string;
  components: string[];
}

export interface AppComponent {
  componentId: string;
  name: string;
  responsibility: string;
  props?: string[];
  stateUsed?: string[];
}

export interface AppStateModel {
  stateFields: string[];
  localStorageFields?: string[];
  derivedStates?: string[];
}

export interface AppDataModel {
  entities: { name: string; fields: string[] }[];
}

export interface AppEventFlow {
  from: string;
  to: string;
  event: string;
}

export interface AppArchitectureObject {
  architectureId: string;
  projectId: string;
  frameworkTarget: AppFrameworkTarget;
  pageMap: AppPage[];
  componentMap: AppComponent[];
  stateModel: AppStateModel;
  dataModel: AppDataModel;
  eventFlow: AppEventFlow[];
  risks: string[];
}

export interface AppRequirementObject {
  requirementId: string;
  projectId: string;
  productSummary: string;
  targetUsers: string[];
  userStories: string[];
  mvpFeatures: AppFeature[];
  nonGoals: string[];
  acceptanceCriteria: string[];
  constraints: string[];
}

export interface AppFileNode {
  path: string;
  fileType: "HTML" | "CSS" | "JS" | "TSX" | "JSON" | "MD" | "CONFIG";
  purpose: string;
  required: boolean;
}

export interface AppFileTreeObject {
  fileTreeId: string;
  projectId: string;
  frameworkTarget: AppFrameworkTarget;
  files: AppFileNode[];
}

export interface AppCodeFile {
  fileId: string;
  path: string;
  language: string;
  content: string;
  purpose: string;
  editable: boolean;
  generatedAt: string;
}

export interface AppPreviewConfig {
  previewId: string;
  projectId: string;
  previewMode: "IFRAME_HTML" | "CODE_VIEW_ONLY" | "EXTERNAL_HANDOFF";
  entryFile: string;
  previewHtml?: string;
  limitations: string[];
}

export interface AppQaIssue {
  ruleId: string;
  severity: "INFO" | "WARN" | "FAIL" | "CRITICAL";
  message: string;
}

export interface AppQaResult {
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  issues: AppQaIssue[];
  recommendedFixes: string[];
}

export interface AppExportPackage {
  packageId: string;
  projectId: string;
  exportTarget: AppExportTarget;
  files: AppCodeFile[];
  metadata: Record<string, unknown>;
  safetyNotes: string[];
}

export interface AppHandoffPack {
  packId: string;
  targetTool: AppHandoffTarget;
  title: string;
  prompt: string;
  includedFiles: string[];
  instructions: string[];
  acceptanceCriteria: string[];
  safetyBoundaries: string[];
}

export interface AppProjectObject {
  projectId: string;
  projectName: string;
  appType: AppType;
  appRuntimeMode: AppRuntimeMode;
  sourceInput: string;
  intentSummary: string;
  targetUsers: string[];
  coreValue: string;
  mvpScope: string[];
  featureList: AppFeature[];
  architecture: AppArchitectureObject;
  fileTree: AppFileTreeObject;
  codeFiles: AppCodeFile[];
  requirement: AppRequirementObject;
  previewConfig?: AppPreviewConfig;
  qaResult?: AppQaResult;
  exportPackages: AppExportPackage[];
  handoffPacks: AppHandoffPack[];
  workspaceRecordId?: string;
  version: string;
  status: "DRAFT" | "PREVIEW_READY" | "QA_WARN" | "QA_FAIL" | "EXPORTED";
  safetyNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export function createAppProjectId(): string {
  return `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
