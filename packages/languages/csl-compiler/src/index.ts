// CSL 入口 — v0.9 起：runCSL 走 versions/dispatch，按 grammar version 路由
// v0.8 调用方式（不传 version）保持兼容：默认为 'v0.8'

export { runCSL, tokenizeForVersion } from './versions/dispatch';
export type { CSLResult } from './versions/dispatch';

export {
  VERSION_FEATURES, VERSION_LABELS, FEATURE_LABELS, ALL_FLAGS, isFeatureEnabled,
} from './versions/registry';
export type { GrammarVersion, FeatureFlag } from './versions/registry';

// MVP-1: CapabilityProfile 单一真源
export {
  getCapabilityProfile, compileCapabilityProfile, resetCapabilityCache,
  isFeatureOn, isModeOn, whyModeUnavailable,
  COMPILER_VERSION, OSE_POLICY_VERSION,
} from './capability';
export type { CapabilityProfile, ViewMode, OSESeverity } from './capability';

// MVP-1: RuntimeGuard
export { guard, enforce, RuntimeGuardError } from './runtime/guard';
export type { GuardOp, GuardContext, GuardResult, OSEVerdict } from './runtime/guard';

// P1: OSEVerdict schema + IR _meta 完整性
export { validateOSEVerdict, assertOSEVerdict } from './runtime/ose-verdict-schema';
export type { OSEVerdictSchemaIssue } from './runtime/ose-verdict-schema';
export { checkIRMetaCompleteness, assertIRMetaComplete } from './ir-builder/meta-assert';
export type { IRMetaCheckResult } from './ir-builder/meta-assert';

// 兼容老引用：暴露底层模块
export { tokenize } from './lexer';
export { Parser } from './parser';
export { buildIR } from './ir-builder';
export { validate, select, infer, trace, callCSLFunction } from './runtime';
export { advanceAllSubjects, evaluateCandidates, computeAutoPath } from './stage-engine';
export type { SubjectAdvancement, CandidateTransition, PathStep, TransitionStatus } from './stage-engine';
export type * from './types';
