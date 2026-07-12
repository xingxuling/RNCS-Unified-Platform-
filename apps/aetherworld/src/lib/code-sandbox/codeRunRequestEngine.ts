import type { CodeSandboxMode } from "@/constants/code-sandbox/codeSandboxModes";
import type { CodeRunSource, CodeRunFileRole } from "@/constants/code-sandbox/codeSandboxRunnerTypes";
import type { CodeErrorType } from "@/constants/code-sandbox/codeErrorTypes";
import type { CodePatchType } from "@/constants/code-sandbox/codePatchTypes";

export interface CodeRunTargetFile {
  path: string;
  language: string;
  content: string;
  role: CodeRunFileRole;
}

export interface CodeRunRequest {
  requestId: string;
  projectId: string;
  source: CodeRunSource;
  runnerMode: CodeSandboxMode;
  targetFiles: CodeRunTargetFile[];
  requestedCommand?: string;
  allowedCommand?: boolean;
  runPurpose: string;
  createdAt: string;
  safetyNotes: string[];
}

export interface CodeRunLog {
  logId: string;
  level: "INFO" | "WARN" | "ERROR" | "SYSTEM";
  message: string;
  source: string;
  timestamp: string;
}

export interface CodeErrorSummary {
  errorId: string;
  errorType: CodeErrorType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  explanation: string;
  affectedFiles: string[];
  suspectedCauses: string[];
}

export interface CodeRepairSuggestion {
  suggestionId: string;
  title: string;
  explanation: string;
  affectedFiles: string[];
  suggestedActions: string[];
  confidence: number;
  errorType?: CodeErrorType;
  canAutoPatch?: boolean;
  requiresHumanReview?: boolean;
}

export interface CodePatchDraft {
  patchId: string;
  patchType: CodePatchType;
  affectedFile: string;
  beforeSummary: string;
  afterSummary: string;
  patchContent: string;
  requiresHumanReview: boolean;
  safetyNotes: string[];
}

export interface CodexRepairPack {
  packId: string;
  title: string;
  projectSummary: string;
  filesIncluded: CodeRunTargetFile[];
  errorSummary?: CodeErrorSummary;
  requestedFixes: string[];
  constraints: string[];
  acceptanceCriteria: string[];
  outputContract: string[];
  prompt: string;
}

export interface CursorRepairPack {
  packId: string;
  title: string;
  fileContexts: { path: string; purpose: string; snippet: string }[];
  repairNotes: string[];
  testSuggestions: string[];
  safetyNotes: string[];
}

export interface CodeSandboxQaIssue {
  ruleId: string;
  severity: "INFO" | "WARN" | "FAIL" | "CRITICAL";
  message: string;
}

export interface CodeSandboxQaResult {
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  issues: CodeSandboxQaIssue[];
  recommendedFixes: string[];
}

export interface CodeRunResult {
  runId: string;
  requestId: string;
  projectId: string;
  runnerMode: CodeSandboxMode;
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED" | "SIMULATED";
  startedAt: string;
  finishedAt?: string;
  logs: CodeRunLog[];
  errorSummary?: CodeErrorSummary;
  repairSuggestions: CodeRepairSuggestion[];
  patchDrafts: CodePatchDraft[];
  codexPack?: CodexRepairPack;
  cursorPack?: CursorRepairPack;
  previewHtml?: string;
  qaResult?: CodeSandboxQaResult;
  workspaceRecordId?: string;
  versionImpact?: string;
  safetyNotes: string[];
}

export function createRunId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createRequestId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
