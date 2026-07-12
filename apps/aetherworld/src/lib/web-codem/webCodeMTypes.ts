// WebCodeM 单点能力 — 类型定义

export type WebCodeMTaskType =
  | "CREATE_APP"
  | "GENERATE_CODE"
  | "CHECK_PROJECT"
  | "EXPLAIN_ERROR"
  | "REPAIR_CODE"
  | "GENERATE_PATCH"
  | "GENERATE_HANDOFF"
  | "IMPROVE_APP";

export type WebCodeMMode = "REAL_WEBLLM" | "RULE_TEMPLATE";

export interface WebCodeMErrorBrief {
  file?: string;
  severity: string;
  message: string;
}

export interface WebCodeMPatchBrief {
  file: string;
  risk: string;
  reason: string;
}

export interface WebCodeMRunRecord {
  runId: string;
  taskType: WebCodeMTaskType;
  rawInput: string;
  source: "WEB_CODE_M";
  mode: WebCodeMMode;
  llmReady: boolean;
  projectId?: string;
  projectName?: string;
  appType?: string;
  fileCount?: number;
  codeRunId?: string;
  errorCount?: number;
  warningCount?: number;
  qaStatus?: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  errors?: WebCodeMErrorBrief[];
  repairSummary?: string[];
  patchSummary?: WebCodeMPatchBrief[];
  handoffTarget?: "CODEX" | "CURSOR" | "LOVABLE";
  handoffTitle?: string;
  notes: string[];
  createdAt: string;
}

export interface WebCodeMQaIssue {
  ruleId: string;
  severity: "INFO" | "WARN" | "FAIL" | "CRITICAL";
  message: string;
}

export interface WebCodeMQaResult {
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  issues: WebCodeMQaIssue[];
  recommendedFixes: string[];
}

export interface WebCodeMResultAction {
  type: string;
  label: string;
  route?: string;
  payload?: Record<string, unknown>;
}

export interface WebCodeMResult {
  run: WebCodeMRunRecord;
  qa: WebCodeMQaResult;
  cardTitle: string;
  cardBullets: string[];
  modeNote: string;
  actions: WebCodeMResultAction[];
}
