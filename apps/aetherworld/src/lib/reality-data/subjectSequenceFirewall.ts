// Subject Sequence Firewall — prevents external data from polluting Full60/Light20.
import type { ExternalDataSource } from "./externalDataSourceRegistry";

export interface SubjectSequenceFirewallResult {
  allowed: boolean;
  blockedReason?: string;
  dataCanAffect: string[];
  dataCannotAffect: string[];
  safetyNotes: string[];
}

export interface FirewallInput {
  source: ExternalDataSource;
  targetSubjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
  action: "READ" | "ANNOTATE" | "AFFECT_OUTPUT" | "OVERWRITE_SUBJECT" | "VERSION_NEW_PROFILE";
}

export function checkFirewall(input: FirewallInput): SubjectSequenceFirewallResult {
  const { source, targetSubjectMode, action } = input;
  const canAffect = ["calibratedOutput", "calibrationProfile", "validationHistory"];
  const cannotAffect = ["Full60 主体核心数列", "Light20 主体核心数列", "Founder Locked 主体核心"];
  const notes: string[] = ["外部数据只能作为校准层、证据层与回验层。"];

  // Demo/Real isolation
  if (source.sourceType === "DEMO_DATA" && targetSubjectMode !== "DEMO") {
    return { allowed: false, blockedReason: "Demo 数据不得进入 Real 主体。", dataCanAffect: [], dataCannotAffect: cannotAffect, safetyNotes: notes };
  }
  if (source.sourceType === "FICTIONAL_WORLD_DATA") {
    return { allowed: false, blockedReason: "虚构世界数据不得作为现实证据。", dataCanAffect: [], dataCannotAffect: cannotAffect, safetyNotes: notes };
  }
  // Founder isolation
  if (source.privacyLevel === "FOUNDER_PRIVATE" && targetSubjectMode !== "FOUNDER") {
    return { allowed: false, blockedReason: "Founder 私有数据不得进入普通模式。", dataCanAffect: [], dataCannotAffect: cannotAffect, safetyNotes: notes };
  }
  // Overwrite forbidden
  if (action === "OVERWRITE_SUBJECT") {
    return { allowed: false, blockedReason: "外部数据不允许改写 Full60 / Light20 主体数列。", dataCanAffect: canAffect, dataCannotAffect: cannotAffect, safetyNotes: [...notes, "如需更新主体画像，请生成新版本 profile（VERSION_NEW_PROFILE）。"] };
  }
  return { allowed: true, dataCanAffect: canAffect, dataCannotAffect: cannotAffect, safetyNotes: notes };
}
