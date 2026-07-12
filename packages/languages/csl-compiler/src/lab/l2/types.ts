// L2 影子分支 — 二阶段语法类型定义 (P13)
//
// 严格隔离纪律:
//   - 本目录下所有内容仅服务于 v0.10-alpha 影子分支
//   - 不得被 src/csl/lexer.ts / parser.ts / ir-builder.ts / runtime.ts 引用
//   - 不得在主线 runCSL 路径上注册
//   - 仅供 Viewer / Compare / inspect / OSE 影子层读取
//
// 第一批四类语法:引擎 / 模块 / 职责 / 前置-后置约束
// 不开:母体 / 历史 / 状态 / regeneration 深实现 / signal 网络

/** L2 grammar 版本标识 — 与主线 v0.8 / v0.9 完全分开 */
export type L2GrammarVersion = 'v0.10-alpha';

/** L2 feature flag — 默认全关,需显式开 */
export type L2FeatureFlag =
  | 'l2.engines'
  | 'l2.modules'
  | 'l2.responsibilities'
  | 'l2.constraints';

export interface L2SourceSpan {
  line: number;
  col: number;
}

// ---------- AST ----------

export interface L2EngineNode {
  kind: 'L2Engine';
  name: string;
  /** 引擎下声明的模块名引用 */
  modules: string[];
  /** 引擎下声明的职责名引用 */
  responsibilities: string[];
  span: L2SourceSpan;
}

export interface L2ModuleNode {
  kind: 'L2Module';
  name: string;
  /** 前置约束名引用 */
  pre: string[];
  /** 后置约束名引用 */
  post: string[];
  span: L2SourceSpan;
}

export interface L2ResponsibilityNode {
  kind: 'L2Responsibility';
  name: string;
  /** 归属(模块名或引擎名);未归属时为 undefined */
  owner?: string;
  span: L2SourceSpan;
}

export type L2ConstraintKind = 'pre' | 'post';

export interface L2ConstraintNode {
  kind: 'L2Constraint';
  constraintKind: L2ConstraintKind;
  name: string;
  /** 表达式纯文本 — 本轮不深解析 */
  expr: string;
  span: L2SourceSpan;
}

export type L2Node =
  | L2EngineNode
  | L2ModuleNode
  | L2ResponsibilityNode
  | L2ConstraintNode;

export interface L2Program {
  kind: 'L2Program';
  version: L2GrammarVersion;
  nodes: L2Node[];
}

// ---------- IR ----------

export interface L2IREngine {
  name: string;
  modules: string[];
  responsibilities: string[];
}
export interface L2IRModule {
  name: string;
  pre: string[];
  post: string[];
}
export interface L2IRResponsibility {
  name: string;
  owner?: string;
}
export interface L2IRConstraint {
  name: string;
  kind: L2ConstraintKind;
  expr: string;
}

export interface L2IR {
  version: L2GrammarVersion;
  engines: L2IREngine[];
  modules: L2IRModule[];
  responsibilities: L2IRResponsibility[];
  constraints: L2IRConstraint[];
}

// ---------- 诊断 ----------

export interface L2Diagnostic {
  level: 'error' | 'warn' | 'info';
  code: string;
  message: string;
  span?: L2SourceSpan;
}

export interface L2ParseResult {
  version: L2GrammarVersion;
  enabled: L2FeatureFlag[];
  program: L2Program;
  ir: L2IR;
  diagnostics: L2Diagnostic[];
}
