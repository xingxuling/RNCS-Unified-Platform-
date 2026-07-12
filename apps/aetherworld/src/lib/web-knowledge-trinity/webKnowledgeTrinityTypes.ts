// Shared types & helpers for Web Knowledge Trinity
import type { WebKnowledgeSourceType } from "@/constants/web-knowledge-trinity/webKnowledgeSourceTypes";
import type { WebCalculusModelType } from "@/constants/web-knowledge-trinity/webCalculusModelTypes";
import type { WebConstantModelType } from "@/constants/web-knowledge-trinity/webConstantModelTypes";

export function newWktId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type FreshnessStatus = "CURRENT" | "STALE" | "UNKNOWN" | "CONFLICTED";
export type PrivacyLevel = "PUBLIC_DEMO" | "USER_PRIVATE" | "FOUNDER_PRIVATE" | "SYSTEM_ONLY";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type QaStatus = "PASS" | "WARN" | "FAIL" | "BLOCKED";

export interface WebLkmEvidenceItem {
  evidenceId: string;
  sourceType: WebKnowledgeSourceType;
  sourceId: string;
  claim: string;
  confidence: number;
  createdAt: string;
}

export interface WebLkmKnowledgeItem {
  knowledgeId: string;
  title: string;
  sourceType: WebKnowledgeSourceType;
  sourceId?: string;
  contentSummary: string;
  keywords: string[];
  domainTags: string[];
  version?: string;
  evidenceChain?: WebLkmEvidenceItem[];
  freshnessStatus: FreshnessStatus;
  privacyLevel: PrivacyLevel;
  usableBy: string[];
  safetyNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WebCmCalculusItem {
  calculusId: string;
  name: string;
  chineseName: string;
  category: string;
  purpose: string;
  inputTypes: string[];
  outputTypes: string[];
  requiredKnowledgeSources: string[];
  requiredConstants: string[];
  compatibleEngines: string[];
  riskLevel: RiskLevel;
  version: string;
  status: "ACTIVE" | "DRAFT" | "STALE" | "DEPRECATED";
  safetyNotes: string[];
}

export interface WebCmExecutionStep {
  stepId: string;
  calculusId: WebCalculusModelType | string;
  action: string;
  inputSummary: string;
  outputSummary: string;
  status: "PENDING" | "RUNNING" | "DONE" | "BLOCKED";
}

export interface WebCmRoute {
  routeId: string;
  userIntent: string;
  selectedCalculusIds: string[];
  routeReason: string;
  executionSteps: WebCmExecutionStep[];
  requiredKnowledgeIds: string[];
  requiredConstantIds: string[];
  outputContract: string[];
  qaRequired: boolean;
  createdAt: string;
}

export interface WebCoMConstantItem {
  constantId: string;
  name: string;
  chineseName: string;
  constantType: WebConstantModelType;
  definition: string;
  invariantRule: string;
  appliesTo: string[];
  forbiddenMisuse: string[];
  relatedCalculusIds: string[];
  relatedKnowledgeIds: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "ABSOLUTE";
  version: string;
  safetyNotes: string[];
}

export interface WebCoMConstraintBundle {
  bundleId: string;
  appliedConstantIds: string[];
  contextSummary: string;
  taskType: string;
  createdAt: string;
}

export interface WebKnowledgeQaIssue {
  ruleId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
}

export interface WebKnowledgeQaReport {
  status: QaStatus;
  issues: WebKnowledgeQaIssue[];
  recommendedFixes: string[];
  checkedAt: string;
}

export interface WebKnowledgeTrinityRun {
  runId: string;
  userIntent: string;
  retrievedKnowledgeIds: string[];
  selectedCalculusRouteId: string;
  appliedConstantIds: string[];
  conceptChainId?: string;
  webLlmRunId?: string;
  finalOutputSummary: string;
  qaStatus: QaStatus;
  createdAt: string;
}
