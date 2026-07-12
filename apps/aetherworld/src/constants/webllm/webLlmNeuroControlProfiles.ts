export interface NeuroControlProfile {
  profileId: string;
  name: string;
  localDetailFocus: number;          // 0..1
  globalContextWeight: number;       // 0..1
  predictionErrorSensitivity: number;// 0..1
  consistencyThreshold: number;      // 0..1
  contextSwitchCost: number;         // 0..1
  executiveGateStrictness: number;   // 0..1
  ambiguityTolerance: number;        // 0..1
  outputCompressionPreference: number;// 0..1
  notes: string[];
}

export const WEB_LLM_NEURO_CONTROL_PROFILES: NeuroControlProfile[] = [
  { profileId: "BALANCED_CONTROL",       name: "平衡模式",         localDetailFocus: 0.6, globalContextWeight: 0.6, predictionErrorSensitivity: 0.6, consistencyThreshold: 0.7, contextSwitchCost: 0.5, executiveGateStrictness: 0.6, ambiguityTolerance: 0.5, outputCompressionPreference: 0.5, notes: ["默认 profile。"] },
  { profileId: "HIGH_DETAIL_LOW_DRIFT",  name: "高细节低漂移",      localDetailFocus: 0.9, globalContextWeight: 0.5, predictionErrorSensitivity: 0.85, consistencyThreshold: 0.9, contextSwitchCost: 0.7, executiveGateStrictness: 0.7, ambiguityTolerance: 0.3, outputCompressionPreference: 0.4, notes: ["适合 PRD、规格、文档。"] },
  { profileId: "STRICT_RULE_EXECUTION",  name: "强规则执行",        localDetailFocus: 0.8, globalContextWeight: 0.4, predictionErrorSensitivity: 0.9, consistencyThreshold: 0.95, contextSwitchCost: 0.8, executiveGateStrictness: 0.95, ambiguityTolerance: 0.2, outputCompressionPreference: 0.6, notes: ["适合宪法相关、QA 相关任务。"] },
  { profileId: "CREATIVE_BUT_GATED",     name: "创造性 + 闸门",     localDetailFocus: 0.5, globalContextWeight: 0.7, predictionErrorSensitivity: 0.5, consistencyThreshold: 0.6, contextSwitchCost: 0.4, executiveGateStrictness: 0.7, ambiguityTolerance: 0.7, outputCompressionPreference: 0.3, notes: ["适合剧情、歌词。"] },
  { profileId: "CODE_REPAIR_FOCUSED",    name: "代码修复",         localDetailFocus: 0.95, globalContextWeight: 0.5, predictionErrorSensitivity: 0.9, consistencyThreshold: 0.9, contextSwitchCost: 0.6, executiveGateStrictness: 0.8, ambiguityTolerance: 0.3, outputCompressionPreference: 0.5, notes: ["用于 Code Sandbox Bridge。"] },
  { profileId: "NARRATIVE_DETAIL_FOCUSED", name: "剧情细节",       localDetailFocus: 0.8, globalContextWeight: 0.6, predictionErrorSensitivity: 0.6, consistencyThreshold: 0.7, contextSwitchCost: 0.5, executiveGateStrictness: 0.6, ambiguityTolerance: 0.6, outputCompressionPreference: 0.4, notes: ["用于 Narrative Engine。"] },
];

export const DEFAULT_NEURO_CONTROL_PROFILE_ID = "BALANCED_CONTROL";
