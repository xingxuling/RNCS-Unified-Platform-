// External Reality Data Calibration Engine — top-level façade.
import { listExternalDataSources, registrySummary } from "./externalDataSourceRegistry";
import { ingestRealityData, type RealityDataIngestionInput, type RealityDataIngestionResult } from "./realityDataIngestionEngine";
import { scoreAll, scoreCredibility, type CredibilityScore } from "./sourceCredibilityScorer";
import { detectAll as detectAllFreshness, detectFreshness, type FreshnessResult } from "./dataFreshnessDetector";
import { detectAllNoise, type NoiseRisk } from "./dataNoiseFilter";
import { mapEvidence, type EvidenceItem, type EvidenceMappingInput } from "./evidenceMappingEngine";
import { extractRealityVariables, type RealityVariable } from "./realityVariableExtractor";
import { planCalibration, classifyQuestion, type CalibrationPlan } from "./realityCalibrationPlanner";
import { checkFirewall, type SubjectSequenceFirewallResult, type FirewallInput } from "./subjectSequenceFirewall";
import { runRealityDataAudit, type RealityDataAuditResult } from "./realityDataAuditEngine";
import { collectRecalculationTriggers } from "./realityDataRecalculationBridge";
import { runRealitySafetyCheck, listRealitySafetyRules } from "./realityDataSafetyGuard";
import { listValidationRecords, validationSummary } from "./realityDataValidationEngine";
import { exportRealityData } from "./realityDataExportEngine";
import type { RealityDataMode } from "@/constants/reality-data/realityDataModes";

export function realityDataMeta() {
  return {
    engineName: "External Reality Data Calibration Engine",
    engineChineseName: "外部现实数据校准引擎",
    version: "v0.1",
    docsVersion: "v1.0",
  };
}

export interface RealityCalibrationResult {
  subjectModeUsed: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
  realityDataMode: RealityDataMode;
  calibrationPlan: CalibrationPlan;
  realityVariables: RealityVariable[];
  evidenceItems: EvidenceItem[];
  sourceCredibilitySummary: string;
  dataFreshnessSummary: string;
  calibratedConclusion: string;
  uncertainty: string;
  validationPoints: string[];
  recalculationTriggers: string[];
  safetyNotes: string[];
  metadata: {
    generatedAt: string;
    externalDataUsed: boolean;
    sourceCount: number;
    staleSourceCount: number;
    constantUniverseVersion?: string;
    constitutionVersion?: string;
  };
}

export interface CalibrateInput {
  question: string;
  subjectMode?: RealityCalibrationResult["subjectModeUsed"];
  realityDataMode?: RealityDataMode;
  userProvidedContent?: string;
}

export function runRealityCalibration(input: CalibrateInput): RealityCalibrationResult {
  const subjectMode = input.subjectMode ?? "LIGHT_20";
  const plan = planCalibration(input.question);
  const mode: RealityDataMode = input.realityDataMode ?? (input.userProvidedContent ? "USER_INPUT_ONLY" : plan.shouldUseExternalData ? "PUBLIC_DATA" : "NO_EXTERNAL_DATA");

  const credibility = scoreAll();
  const freshness = detectAllFreshness();
  const staleCount = freshness.filter((f) => f.freshnessLevel === "STALE").length;
  const sources = listExternalDataSources();

  const evidenceItems: EvidenceItem[] = [];
  const realityVariables: RealityVariable[] = [];
  let externalDataUsed = false;

  if (mode === "USER_INPUT_ONLY" && input.userProvidedContent) {
    const ingest = ingestRealityData({ sourceName: "用户输入", sourceType: "USER_PROVIDED", content: input.userProvidedContent });
    if (ingest.source) {
      externalDataUsed = true;
      evidenceItems.push(mapEvidence({
        sourceId: ingest.source.sourceId,
        sourceType: ingest.source.sourceType,
        content: input.userProvidedContent,
        freshnessLevel: "FRESH",
        credibilityLevel: ingest.source.credibilityLevel,
      }));
      realityVariables.push(...extractRealityVariables({
        sourceId: ingest.source.sourceId,
        content: input.userProvidedContent,
        freshnessLevel: "FRESH",
        credibilityLevel: ingest.source.credibilityLevel,
        relatedQuestion: input.question,
      }));
    }
  } else if (mode !== "NO_EXTERNAL_DATA") {
    externalDataUsed = true;
    // sample from registry to demonstrate
    sources.slice(0, 3).forEach((s) => {
      const fr = freshness.find((f) => f.sourceId === s.sourceId);
      evidenceItems.push(mapEvidence({
        sourceId: s.sourceId,
        sourceType: s.sourceType,
        content: `${s.sourceName} 提供的相关参考。`,
        freshnessLevel: fr?.freshnessLevel ?? "UNKNOWN",
        credibilityLevel: s.credibilityLevel,
      }));
    });
  }

  const recBridge = collectRecalculationTriggers();
  const safetyNotes = [
    "外部数据只用于校准与证据，不会自动改写 Full60 / Light20 主体数列。",
    `当前外部数据使用：${externalDataUsed ? "是" : "否"}。`,
  ];
  if (plan.questionType === "MEDICAL_LEGAL_FINANCIAL") {
    safetyNotes.push("高风险领域：不构成医疗 / 法律 / 金融 / 心理诊断建议，请咨询专业人士。");
  }
  if (!externalDataUsed && plan.shouldUseExternalData) {
    safetyNotes.push("该问题建议接入外部数据校准。当前仅基于主体数列推演，建议接入公开数据或用户提供资料。");
  }

  const calibratedConclusion = mode === "NO_EXTERNAL_DATA"
    ? `基于主体数列 (${subjectMode}) 推演的结构性结论，未使用外部现实数据。`
    : `结合主体数列 (${subjectMode}) 与 ${evidenceItems.length} 条外部证据后的校准结论。`;

  return {
    subjectModeUsed: subjectMode,
    realityDataMode: mode,
    calibrationPlan: plan,
    realityVariables,
    evidenceItems,
    sourceCredibilitySummary: `${credibility.length} 个数据源已评估可信度（平均 ${(credibility.reduce((a, c) => a + c.score, 0) / Math.max(credibility.length, 1)).toFixed(2)}）。`,
    dataFreshnessSummary: `${freshness.length} 个数据源新鲜度检测，stale=${staleCount}。`,
    calibratedConclusion,
    uncertainty: plan.questionType === "MEDICAL_LEGAL_FINANCIAL" ? "HIGH" : externalDataUsed ? "MEDIUM" : "MEDIUM_HIGH",
    validationPoints: [`回验问题：${input.question}`, "可在 Reality Evidence 中追踪证据更新。"],
    recalculationTriggers: recBridge.triggers,
    safetyNotes,
    metadata: {
      generatedAt: new Date().toISOString(),
      externalDataUsed,
      sourceCount: sources.length,
      staleSourceCount: staleCount,
    },
  };
}

export function getRealityDataSummary() {
  const reg = registrySummary();
  const fresh = detectAllFreshness();
  const audit = runRealityDataAudit();
  return {
    ...reg,
    staleSourceCount: fresh.filter((f) => f.freshnessLevel === "STALE").length,
    agingSourceCount: fresh.filter((f) => f.freshnessLevel === "AGING").length,
    auditStatus: audit.status,
    auditIssueCount: audit.issues.length,
    validationRecords: validationSummary().total,
  };
}

export {
  listExternalDataSources, registrySummary, ingestRealityData,
  scoreAll, scoreCredibility, detectAllFreshness, detectFreshness, detectAllNoise,
  mapEvidence, extractRealityVariables, planCalibration, classifyQuestion,
  checkFirewall, runRealityDataAudit, collectRecalculationTriggers,
  runRealitySafetyCheck, listRealitySafetyRules,
  listValidationRecords, validationSummary, exportRealityData,
};
export type {
  RealityDataIngestionInput, RealityDataIngestionResult, CredibilityScore,
  FreshnessResult, NoiseRisk, EvidenceItem, EvidenceMappingInput, RealityVariable,
  CalibrationPlan, SubjectSequenceFirewallResult, FirewallInput, RealityDataAuditResult,
};
