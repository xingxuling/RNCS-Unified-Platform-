// L2 影子分支 — 公共导出入口 (P13)
//
// Viewer / Compare / summary 等上层模块只通过本文件接触 L2,
// 不允许直接深入 lab/l2/ 内部实现。
//
// 严禁:
//   - 在 src/csl/index.ts 主线导出中转出本文件
//   - 在 main runCSL 路径上调用 parseL2

export type {
  L2GrammarVersion, L2FeatureFlag,
  L2Program, L2Node, L2EngineNode, L2ModuleNode, L2ResponsibilityNode, L2ConstraintNode,
  L2IR, L2IREngine, L2IRModule, L2IRResponsibility, L2IRConstraint,
  L2Diagnostic, L2ParseResult, L2SourceSpan, L2ConstraintKind,
} from './types';

export {
  L2_ALL_FLAGS, L2_FEATURE_LABELS, L2_VERSION_LABEL,
  L2_KEYWORD_TO_FLAG, isL2FlagEnabled,
} from './registry';

export { parseL2, type L2ParseOptions } from './parser';
export {
  summarizeL2, compareL2,
  type L2Summary, type L2CompareReport, type L2DiffEntry, type L2DiffKind,
} from './inspect';
export { runL2OSE, type L2OSEReport } from './ose-shadow';
export { runL2OSEv2 } from './ose-shadow-v2';
export {
  parseL2Expr, collectExprRefs,
  type L2ExprNode, type L2ExprParseResult, type L2ExprDiagnostic,
} from './expr';
export {
  computeL2WeakBinding,
  type MainlineNameIndex, type L2WeakBindingReport, type L2BindingHint, type L2BindingHintLevel,
} from './binding';
export { isLikelyL2Source } from './detect';
