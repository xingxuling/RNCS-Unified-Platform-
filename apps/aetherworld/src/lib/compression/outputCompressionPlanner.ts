// 压缩策略规划
import type { CompressionLevelId } from "@/constants/compression/compressionLevels";
import { getCompressionLevel } from "@/constants/compression/compressionLevels";
import type { ExplainabilityModeId } from "@/constants/compression/explainabilityModes";
import type { OutputAudienceId } from "@/constants/compression/outputAudienceTypes";
import type { RawEngineOutput } from "./blackBoxSignalExtractor";

export interface CompressionInput {
  rawEngineOutputs: RawEngineOutput[];
  userLevel: OutputAudienceId;
  targetModule: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  outputGoal: string;
  language: string;
}

export interface CompressionPlan {
  compressionLevel: CompressionLevelId;
  explainabilityMode: ExplainabilityModeId;
  showBlackBoxSignals: boolean;
  showWhiteBoxEvidence: boolean;
  showEngineTrace: boolean;
  maxSections: number;
  maxLength: number;
  requiredSafetyNotes: string[];
}

export function planCompression(input: CompressionInput): CompressionPlan {
  const { userLevel, riskLevel } = input;

  // 高风险优先
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    const lvl = getCompressionLevel("SAFE_MINIMAL");
    return {
      compressionLevel: "SAFE_MINIMAL",
      explainabilityMode: "SAFE_MINIMAL",
      showBlackBoxSignals: userLevel === "FOUNDER_USER",
      showWhiteBoxEvidence: true,
      showEngineTrace: userLevel === "FOUNDER_USER",
      maxSections: lvl.maxSections,
      maxLength: lvl.maxLength,
      requiredSafetyNotes: ["高风险领域，输出已最小化。", "请勿将压缩结果当作最终决策依据。"],
    };
  }

  let level: CompressionLevelId = "NORMAL_USER";
  let mode: ExplainabilityModeId = "EXPLAINED";
  let showBB = false;
  let showWB = false;
  let showTrace = false;

  switch (userLevel) {
    case "PLAIN_USER":
      level = "NORMAL_USER"; mode = "DIRECT"; break;
    case "STRUCTURED_USER":
      level = "STRUCTURED"; mode = "EXPLAINED"; showWB = true; break;
    case "CREATOR_USER":
      level = "STRUCTURED"; mode = "EVIDENCE_BASED"; showWB = true; break;
    case "DEVELOPER_USER":
      level = "TECHNICAL_TRACE"; mode = "TRACE_BASED"; showWB = true; showTrace = true; break;
    case "FOUNDER_USER":
      level = "FULL_FOUNDER"; mode = "BLACK_WHITE_MIXED"; showBB = true; showWB = true; showTrace = true; break;
  }

  const lvl = getCompressionLevel(level);
  return {
    compressionLevel: level,
    explainabilityMode: mode,
    showBlackBoxSignals: showBB,
    showWhiteBoxEvidence: showWB,
    showEngineTrace: showTrace,
    maxSections: lvl.maxSections,
    maxLength: lvl.maxLength,
    requiredSafetyNotes: riskLevel === "MEDIUM" ? ["请结合人工判断使用。"] : [],
  };
}
