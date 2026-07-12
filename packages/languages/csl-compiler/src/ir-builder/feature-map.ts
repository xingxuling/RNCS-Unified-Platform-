// MVP-2: IR 层规格主权 — AST 节点类型到 feature flag 的反向映射
// 
// 语义约定:
//   - null        = v0.8 核心节点,不受 feature 管控,永远生成
//   - FeatureFlag = 受该 feature 管控,feature 关闭时进入 disabled 降级
//   - undefined   = 未登记(构建表中缺失),IR builder 必须拒绝并记 illegal
//
// 任何新 feature 必须在此登记,否则 IR builder 拒绝处理。
// 这张表就是 IR 层的规格主权。

import type { FeatureFlag } from '../versions/registry';

export const IR_NODE_TO_FEATURE: Record<string, FeatureFlag | null> = {
  // —— v0.8 核心:null 表示不受 feature 管控 ——
  ConceptDecl: null,
  EntityDecl: null,
  AttributeDecl: null,
  InvariantDecl: null,
  InlineInvariant: null,
  RuleDecl: null,
  EvidenceDecl: null,

  // —— v0.9 函数族 ——
  FunctionDecl: 'functions',
  IfExpr: 'conditionals',
  FunctionCallExpr: 'call',
  TemplateDecl: 'templates',
  TemplateExpand: 'expand',

  // —— v0.9 主权阶段族 ——
  SubjectDecl: 'subjects',
  StageDecl: 'sovereignty_stages',
  TransitionDecl: 'stage_transitions',
  CompilerLayerDecl: 'compiler_layers',
  RegenerationDecl: 'regeneration_events',
  SignalDecl: 'signals',

  // —— v0.9 东方本体论族 ——
  MappingTableDecl: 'mapping_tables',
  ClosureDecl: 'sealing',
  CorrespondenceChainDecl: 'colocation_chains',
  DomainExpansionDecl: 'domain_expansion',

  // —— 主权判断操作系统族(v0.9 占位,当前多为 disabled) ——
  UnitDecl: 'units',
  EstablishmentDecl: 'establishment',
  ProfileDecl: 'establishment',
  TradeoffDecl: 'tradeoffs',

  // —— 数字文明母体引擎族(v0.9 占位) ——
  EngineDecl: 'engines',
  ModuleDecl: 'modules',
  EngineActionDecl: 'engines',
  AxisDecl: 'engines',

  // —— 概念级 AI 长期记忆块族 ——
  ConceptBlockDecl: 'concept_blocks',
  PropositionBlockDecl: 'proposition_blocks',
  RelationBlockDecl: 'relation_blocks',
};

/** 从 AST 节点提取用于日志展示的 name(尽可能健壮,容错未知结构) */
export function extractNodeName(node: { type: string } & Record<string, unknown>): string {
  if (typeof node.name === 'string') return node.name;
  if (typeof node.target_name === 'string') return node.target_name;
  if (typeof node.template_name === 'string') return node.template_name;
  return '<anonymous>';
}
