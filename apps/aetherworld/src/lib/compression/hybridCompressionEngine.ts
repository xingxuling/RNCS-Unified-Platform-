// 黑白箱混合压缩输出引擎 · 主入口
import type { CompressionInput, CompressionPlan } from "./outputCompressionPlanner";
import { planCompression } from "./outputCompressionPlanner";
import { extractBlackBoxSignals, type BlackBoxSignal, type RawEngineOutput } from "./blackBoxSignalExtractor";
import { extractWhiteBoxStructure, type WhiteBoxStructure } from "./whiteBoxStructureExtractor";
import { compressTrace, type CompressedTrace } from "./traceCompressionEngine";
import { compressEvidence, type CompressedEvidence } from "./evidenceCompressionEngine";
import { compressActions, type CompressedActionPlan } from "./actionCompressionEngine";
import { compressValidation, type CompressedValidation } from "./validationCompressionEngine";
import { buildExplainability, type ExplainabilityPayload } from "./explainabilityLayerEngine";
import { runCompressionSafety, type CompressionSafetyResult } from "./compressionSafetyGuard";
import { adaptForAudience } from "./userLevelOutputAdapter";
import { getTemplate, type CompressedOutputTemplateId } from "@/constants/compression/compressedOutputTemplates";

export interface CompressedOutput {
  title: string;
  compressionLevel: string;
  audienceType: string;
  plainConclusion: string;
  shortReason: string;
  keySignals?: string[];
  visibleEvidence?: string[];
  nextActions: string[];
  validationPoints: string[];
  riskNotes: string[];
  hiddenTraceAvailable: boolean;
  founderTrace?: object;
  safetyNotes: string[];
}

export interface HybridCompressionResult {
  plan: CompressionPlan;
  output: CompressedOutput;
  blackBoxSignals: BlackBoxSignal[];
  whiteBox: WhiteBoxStructure;
  trace: CompressedTrace;
  evidence: CompressedEvidence;
  actions: CompressedActionPlan;
  validation: CompressedValidation;
  explainability: ExplainabilityPayload;
  safety: CompressionSafetyResult;
}

export interface HybridCompressionRequest extends CompressionInput {
  template?: CompressedOutputTemplateId;
  title?: string;
  subjectMode?: "DEMO" | "REAL" | "FOUNDER";
}

export function runHybridCompression(req: HybridCompressionRequest): HybridCompressionResult {
  const plan = planCompression(req);
  const signals = extractBlackBoxSignals(req.rawEngineOutputs, req.userLevel);
  const wb = extractWhiteBoxStructure(req.rawEngineOutputs);
  const trace = compressTrace(req.rawEngineOutputs, req.userLevel);
  const evidence = compressEvidence(wb, req.userLevel, req.riskLevel);
  const actions = compressActions(req.rawEngineOutputs, req.riskLevel);
  const validation = compressValidation(wb, req.outputGoal);
  const explain = buildExplainability(plan.explainabilityMode, signals, wb);
  const tpl = getTemplate(req.template ?? "DECISION_OUTPUT");

  const baseConclusion = req.rawEngineOutputs[0]?.conclusion ?? wb.objectDefinition;
  const trimmed = trimTo(baseConclusion, Math.min(plan.maxLength, 280));

  let output: CompressedOutput = {
    title: req.title ?? tpl.defaultTitle,
    compressionLevel: plan.compressionLevel,
    audienceType: req.userLevel,
    plainConclusion: trimmed,
    shortReason: explain.whiteBoxSummary ?? wb.keyVariables.slice(0, 3).join(" · ") ?? "—",
    keySignals: plan.showBlackBoxSignals ? signals.slice(0, 5).map(s => `${s.signalName}（${(s.signalStrength * 100).toFixed(0)}%）`) : undefined,
    visibleEvidence: plan.showWhiteBoxEvidence ? evidence.visibleEvidence : undefined,
    nextActions: [actions.primaryAction, ...actions.secondaryActions].slice(0, 5),
    validationPoints: [validation.validationQuestion, ...validation.measurableSignals].slice(0, 5),
    riskNotes: wb.riskFactors.slice(0, 4),
    hiddenTraceAvailable: plan.showEngineTrace,
    founderTrace: plan.compressionLevel === "FULL_FOUNDER" ? {
      signals, whiteBox: wb, trace, evidence, actions, validation, explainability: explain,
    } : undefined,
    safetyNotes: [...plan.requiredSafetyNotes, ...(actions.doNotDo)],
  };

  output = adaptForAudience(output, req.userLevel);

  const safety = runCompressionSafety(output, {
    riskLevel: req.riskLevel,
    audience: req.userLevel,
    subjectMode: req.subjectMode ?? "DEMO",
  });
  // 安全守卫补回 safetyNotes
  if (!safety.passed) output.safetyNotes = [...output.safetyNotes, ...safety.notes];

  return { plan, output, blackBoxSignals: signals, whiteBox: wb, trace, evidence, actions, validation, explainability: explain, safety };
}

function trimTo(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

export { auditCompression } from "./compressionAuditEngine";
export type { CompressionPlan } from "./outputCompressionPlanner";
