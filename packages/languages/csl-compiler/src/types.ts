// ============================================================
// CSL 0.2 Type Definitions — 扩展：函数、条件分支、模板
// ============================================================

// --- Token Types ---

export type TokenType =
  | 'KEYWORD' | 'IDENTIFIER' | 'NUMBER' | 'STRING'
  | 'OPERATOR' | 'LBRACE' | 'RBRACE' | 'LPAREN' | 'RPAREN'
  | 'LANGLE' | 'RANGLE'
  | 'COLON' | 'COMMA' | 'DOT' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

// --- AST Node Types ---

export type ASTNodeType =
  | 'Program' | 'ConceptDecl' | 'EntityDecl'
  | 'AttributeDecl' | 'RelationDecl'
  | 'InvariantDecl' | 'InlineInvariant'
  | 'RuleDecl' | 'EvidenceDecl'
  | 'AssignmentExpr' | 'ConditionExpr' | 'ActionExpr' | 'RefExpr'
  // 0.2
  | 'FunctionDecl' | 'IfExpr' | 'FunctionCallExpr'
  | 'TemplateDecl' | 'TemplateExpand'
  // 0.3 — 高阶语义原语
  | 'SubjectDecl' | 'StageDecl' | 'TransitionDecl'
  | 'CompilerLayerDecl' | 'RegenerationDecl' | 'SignalDecl'
  // 0.4 — 东方本体论原语
  | 'MappingTableDecl' | 'ClosureDecl' | 'CorrespondenceChainDecl' | 'DomainExpansionDecl'
  // 0.5 — 主权判断操作系统原语
  | 'UnitDecl' | 'EstablishmentDecl' | 'ProfileDecl' | 'TradeoffDecl'
  // 0.6 — 数字文明母体引擎原语
  | 'EngineDecl' | 'ModuleDecl' | 'EngineActionDecl' | 'AxisDecl'
  // 0.7 — 概念级 AI 长期记忆块原语
  | 'ConceptBlockDecl' | 'PropositionBlockDecl' | 'RelationBlockDecl';


export interface SourceSpan {
  line_start: number;
  line_end: number;
}

export interface ASTNode {
  type: ASTNodeType;
  source_span?: SourceSpan;
}

export interface ProgramNode extends ASTNode {
  type: 'Program';
  body: ASTNode[];
}

export interface ConceptDeclNode extends ASTNode {
  type: 'ConceptDecl';
  name: string;
  parent: string | null;
  body: ASTNode[];
}

export interface EntityDeclNode extends ASTNode {
  type: 'EntityDecl';
  name: string;
  concept: string;
  body: ASTNode[];
}

export interface AttributeDeclNode extends ASTNode {
  type: 'AttributeDecl';
  name: string;
  value_type: string;
  type_args: Record<string, unknown>;
}

export interface RelationDeclNode extends ASTNode {
  type: 'RelationDecl';
  name: string;
  source_ref: string;
  target_ref: string;
}

export interface InvariantDeclNode extends ASTNode {
  type: 'InvariantDecl';
  name: string;
  scope: string;
  clauses: ConditionExprNode[];
}

export interface InlineInvariantNode extends ASTNode {
  type: 'InlineInvariant';
  expr: ConditionExprNode;
}

export interface RuleDeclNode extends ASTNode {
  type: 'RuleDecl';
  name: string;
  conditions: ConditionExprNode[];
  actions: ActionExprNode[];
  priority: string;
}

export interface EvidenceDeclNode extends ASTNode {
  type: 'EvidenceDecl';
  name: string;
  source: string;
  snippet: string;
  supports: string[];
}

export interface AssignmentExprNode extends ASTNode {
  type: 'AssignmentExpr';
  target: string;
  value: unknown;
}

export interface ConditionExprNode extends ASTNode {
  type: 'ConditionExpr';
  left: string;
  op: string;
  right: unknown;
}

export interface ActionExprNode extends ASTNode {
  type: 'ActionExpr';
  action_type: 'return' | 'mark' | 'exclude' | 'emit_relation' | 'call';
  payload: Record<string, unknown>;
}

export interface RefExprNode extends ASTNode {
  type: 'RefExpr';
  ref_type: string;
  name: string;
}

// --- New in 0.2: Function ---

export interface FunctionDeclNode extends ASTNode {
  type: 'FunctionDecl';
  name: string;
  params: string[];
  body: ASTNode[];  // IfExpr, ActionExpr, AssignmentExpr, etc.
}

export interface IfExprNode extends ASTNode {
  type: 'IfExpr';
  condition: ConditionExprNode;
  then_branch: ASTNode[];
  else_if_branches: Array<{ condition: ConditionExprNode; body: ASTNode[] }>;
  else_branch: ASTNode[];
}

export interface FunctionCallExprNode extends ASTNode {
  type: 'FunctionCallExpr';
  name: string;
  args: string[];
}

// --- New in 0.2: Template ---

export interface TemplateDeclNode extends ASTNode {
  type: 'TemplateDecl';
  name: string;
  type_params: string[];
  body: ASTNode[];
}

export interface TemplateExpandNode extends ASTNode {
  type: 'TemplateExpand';
  template_name: string;
  type_args: string[];
  target_name: string;
}

// --- IR Types ---

export interface ConceptNode {
  id: string;
  name: string;
  parent_id: string | null;
  attribute_ids: string[];
  invariant_ids: string[];
}

export interface EntityNode {
  id: string;
  name: string;
  concept_id: string;
  values: Record<string, unknown>;
  relation_ids: string[];
  evidence_ids: string[];
}

export interface AttributeSpec {
  id: string;
  owner_id: string;
  name: string;
  value_type: string;
  unit: string | null;
  enum_values: string[];
}

export interface RelationEdge {
  id: string;
  name: string;
  source_id: string;
  target_id: string;
  evidence_ids: string[];
}

export interface ClauseSpec {
  left: string;
  op: string;
  right: unknown;
}

export interface InvariantSpec {
  id: string;
  name: string;
  scope_id: string;
  clauses: ClauseSpec[];
}

export interface ActionSpec {
  action_type: string;
  payload: Record<string, unknown>;
}

export interface RuleSpec {
  id: string;
  name: string;
  conditions: ClauseSpec[];
  actions: ActionSpec[];
  priority: string;
}

export interface EvidenceAnchor {
  id: string;
  name: string;
  source: string;
  snippet: string;
  supports: string[];
}

// --- New IR types for 0.2 ---

export interface IfClause {
  condition: ClauseSpec;
  actions: ActionSpec[];
}

export interface FunctionSpec {
  id: string;
  name: string;
  params: string[];
  body: Array<IfClause | ActionSpec>;
}

export interface TemplateSpec {
  id: string;
  name: string;
  type_params: string[];
  body_ast: ASTNode[]; // Keep original AST for expansion
}

// --- New in 0.3: 高阶语义 AST 节点 ---

export interface SubjectDeclNode extends ASTNode {
  type: 'SubjectDecl';
  name: string;
  current_stage: string | null;
  attributes: Record<string, unknown>;
}

export interface StageDeclNode extends ASTNode {
  type: 'StageDecl';
  name: string;
  index: number | null;       // 1..12 for 主权轮回
  keywords: string[];
  description: string;
}

export interface TransitionDeclNode extends ASTNode {
  type: 'TransitionDecl';
  name: string;
  from_stage: string;
  to_stage: string;
  trigger: ConditionExprNode | null;
}

export interface CompilerLayerDeclNode extends ASTNode {
  type: 'CompilerLayerDecl';
  name: string;
  level: string;              // 潜流/浮现/编译/校权/定轨/生成/对接
  inputs: string[];
  outputs: string[];
}

export interface RegenerationDeclNode extends ASTNode {
  type: 'RegenerationDecl';
  name: string;
  subject_ref: string;
  failure: string;            // 失配描述
  diagnosis: string;
  recompose: string;
  new_version: string;
}

export interface SignalDeclNode extends ASTNode {
  type: 'SignalDecl';
  name: string;
  kind: string;               // 前语言/张力/象征/概念冲动
  intensity: number;
  description: string;
}

// --- New in 0.3: 高阶语义 IR ---

export interface SubjectSpec {
  id: string;
  name: string;
  current_stage: string | null;
  attributes: Record<string, unknown>;
}

export interface StageSpec {
  id: string;
  name: string;
  index: number | null;
  keywords: string[];
  description: string;
}

export interface TransitionSpec {
  id: string;
  name: string;
  from_stage: string;
  to_stage: string;
  trigger: ClauseSpec | null;
}

export interface CompilerLayerSpec {
  id: string;
  name: string;
  level: string;
  inputs: string[];
  outputs: string[];
}

export interface RegenerationSpec {
  id: string;
  name: string;
  subject_ref: string;
  failure: string;
  diagnosis: string;
  recompose: string;
  new_version: string;
}

export interface SignalSpec {
  id: string;
  name: string;
  kind: string;
  intensity: number;
  description: string;
}

// --- New in 0.4: 东方本体论原语 AST ---

export interface MappingTableDeclNode extends ASTNode {
  type: 'MappingTableDecl';
  name: string;
  columns: string[];
  rows: Array<{ label: string; items: string[] }>;
}

export interface ClosureDeclNode extends ASTNode {
  type: 'ClosureDecl';
  name: string;
  total: number;
  parts: Array<{ label: string; value: number }>;
}

export interface CorrespondenceChainDeclNode extends ASTNode {
  type: 'CorrespondenceChainDecl';
  name: string;
  domains: string[];
  items: string[];
}

export interface DomainExpansionDeclNode extends ASTNode {
  type: 'DomainExpansionDecl';
  name: string;
  mother_law_values: string[];   // 母法五值，例：无/天/元/公/太
  domains: string[];             // 应用域，例：宇宙/生灵/社会/家庭/人文
  factors: Array<{ domain: string; items: string[] }>; // 每域五因
}

// --- New in 0.4: 东方本体论原语 IR ---

export interface MappingTableSpec {
  id: string;
  name: string;
  columns: string[];
  rows: Array<{ label: string; items: string[] }>;
  /** 校验：每行项数是否等于列数 */
  aligned: boolean;
  misaligned_rows: string[];
}

export interface ClosureSpec {
  id: string;
  name: string;
  total: number;
  parts: Array<{ label: string; value: number }>;
  /** 实际加和 */
  computed_sum: number;
  /** 是否封口成功（sum === total） */
  closed: boolean;
}

export interface CorrespondenceChainSpec {
  id: string;
  name: string;
  domains: string[];
  items: string[];
  /** 校验：项数 === 域数 */
  aligned: boolean;
}

export interface DomainExpansionSpec {
  id: string;
  name: string;
  mother_law_values: string[];
  domains: string[];
  factors: Array<{ domain: string; items: string[] }>;
  /** 自动派生的子概念名（domains × factors 的笛卡尔积），用于参考 */
  derived_concept_names: string[];
}

/** MVP-2: IR 元信息 — 由 CapabilityProfile 快照注入,用于版本冻结 / 导出 / parallel diff */
export interface IRMeta {
  /** CapabilityProfile.id 指纹,下游判定是否同源 */
  readonly profileId: string;
  readonly grammarVersion: string;
  readonly specVersion: string;
  readonly compilerVersion: string;
  readonly osePolicyVersion: string;
  /** 规格标识:独立于 profileId 的 spec 来源标识 */
  readonly sourceSpecId: string;
  /** 完整 featureFlags 快照(包含 false,保留被关闭的证据) */
  readonly featureFlags: Readonly<Record<string, boolean>>;
  /** 生成时启用的 feature 集合(快照,enabledFeatures === Object.keys(featureFlags).filter(k => featureFlags[k])) */
  readonly enabledFeatures: string[];
  /** 生成时启用的视图模式(快照) */
  readonly enabledModes: string[];
  /** OSE 策略快照:下游判定 block 级诊断 */
  readonly osePolicySet: {
    readonly version: string;
    readonly enabledHooks: string[];
    readonly blockingHooks: string[];
  };
  /** IR 构建过程中的规格裁决记录 */
  readonly buildLog: IRBuildLogEntry[];
  /** 生成时间戳 */
  readonly builtAt: string;
}

/** MVP-2: IR builder 对每个顶层 AST 节点的裁决记录 */
export interface IRBuildLogEntry {
  nodeType: string;
  nodeName: string;
  feature: string;
  decision: 'accepted' | 'skipped' | 'disabled' | 'illegal';
  reason?: string;
}

/** MVP-2: 所有 IR Spec 节点可选实现的治理标记(只在 disabled/illegal 时写入) */
export interface IRNodeGovernance {
  _disabled?: boolean;
  _disabledReason?: string;
  _illegal?: boolean;
  _rejectedReason?: string;
}

export interface IRContainer {
  /** MVP-2: 可选的规格快照;未注入时下游走兼容路径 */
  _meta?: IRMeta;
  concepts: ConceptNode[];
  entities: EntityNode[];
  attributes: AttributeSpec[];
  relations: RelationEdge[];
  invariants: InvariantSpec[];
  rules: RuleSpec[];
  evidences: EvidenceAnchor[];
  functions: FunctionSpec[];
  templates: TemplateSpec[];
  // 0.3
  subjects: SubjectSpec[];
  stages: StageSpec[];
  transitions: TransitionSpec[];
  compiler_layers: CompilerLayerSpec[];
  regenerations: RegenerationSpec[];
  signals: SignalSpec[];
  // 0.4
  mapping_tables: MappingTableSpec[];
  closures: ClosureSpec[];
  correspondence_chains: CorrespondenceChainSpec[];
  domain_expansions: DomainExpansionSpec[];
  // 0.5
  units: UnitSpec[];
  establishments: EstablishmentSpec[];
  profiles: ProfileSpec[];
  tradeoffs: TradeoffSpec[];
  // 0.6
  engines: EngineSpec[];
  engine_modules: EngineModuleSpec[];
  engine_actions: EngineActionSpec[];
  engine_axes: AxisSpec[];
  // 0.7 — 概念级 AI 长期记忆块
  concept_blocks: ConceptBlockSpec[];
  proposition_blocks: PropositionBlockSpec[];
  relation_blocks: RelationBlockSpec[];
}

// --- New in 0.5: 主权判断操作系统原语 ---

export interface UnitDeclNode extends ASTNode {
  type: 'UnitDecl';
  name: string;
  layer: string;          // 母体 / 显性 / 隐性 / 微观
  module: string;         // 例：感知采样、结构拆解
  definition: string;
  trigger: string;
  value: string;
  cost: string;
  value_score: number;    // 0-10
  cost_score: number;     // 0-10
}

export interface EstablishmentDeclNode extends ASTNode {
  type: 'EstablishmentDecl';
  name: string;
  layers: Record<string, number>;
  total: number | null;
}

export interface ProfileDeclNode extends ASTNode {
  type: 'ProfileDecl';
  name: string;
  lower: number;
  upper: number;
  description: string;
}

export interface TradeoffDeclNode extends ASTNode {
  type: 'TradeoffDecl';
  name: string;
  units: string[];
  value_threshold: number | null;
  cost_threshold: number | null;
}

export interface UnitSpec {
  id: string;
  name: string;
  layer: string;
  module: string;
  definition: string;
  trigger: string;
  value: string;
  cost: string;
  value_score: number;
  cost_score: number;
  net_score: number;
  quadrant: string;
}

export interface EstablishmentSpec {
  id: string;
  name: string;
  layers: Array<{ label: string; declared: number; actual: number; matched: boolean }>;
  declared_total: number | null;
  actual_total: number;
  total_matched: boolean;
}

export interface ProfileSpec {
  id: string;
  name: string;
  lower: number;
  upper: number;
  description: string;
  activated_units: string[];
}

export interface TradeoffSpec {
  id: string;
  name: string;
  unit_names: string[];
  value_threshold: number | null;
  cost_threshold: number | null;
  total_value: number;
  total_cost: number;
  green_units: string[];
  red_units: string[];
}


// --- New in 0.6: 数字文明母体引擎原语 AST ---

export type EngineKind = 'subject' | 'memory' | 'version' | 'invariant' | 'dynamic' | 'logic' | 'unknown';

export interface EngineDeclNode extends ASTNode {
  type: 'EngineDecl';
  name: string;
  kind: EngineKind;
  position: string;
  constraint: string;
}

export interface ModuleDeclNode extends ASTNode {
  type: 'ModuleDecl';
  name: string;
  engine_ref: string;
  responsibility: string;
  inputs: string[];
  outputs: string[];
}

export interface EngineActionDeclNode extends ASTNode {
  type: 'EngineActionDecl';
  name: string;
  engine_ref: string;
  trigger: string;
  pre: string;
  post: string;
  cost: number;
}

export interface AxisDeclNode extends ASTNode {
  type: 'AxisDecl';
  name: string;
  engine_ref: string;
  index: number;
  meaning: string;
  effect: string;
}

// --- New in 0.6: IR ---

export interface EngineSpec {
  id: string;
  name: string;
  kind: EngineKind;
  position: string;
  constraint: string;
  module_count: number;
  action_count: number;
  axis_count: number;
}

export interface EngineModuleSpec {
  id: string;
  name: string;
  engine_ref: string;
  responsibility: string;
  inputs: string[];
  outputs: string[];
}

export interface EngineActionSpec {
  id: string;
  name: string;
  engine_ref: string;
  trigger: string;
  pre: string;
  post: string;
  cost: number;
}

export interface AxisSpec {
  id: string;
  name: string;
  engine_ref: string;
  index: number;
  meaning: string;
  effect: string;
}


// --- New in 0.7: 概念级 AI 长期记忆块原语 ---
//
// 三种块对应草案第六/七章「概念单元 / 概念库 / 关系图 / 事件链」：
//   概念块 = 概念单元（11 字段）
//   命题块 = 已确认命题（断言型记忆条）
//   关系块 = 概念-概念之间的有类型边

/** 概念类型：草案推荐 5 类 */
export type ConceptBlockKind = '实体' | '原理' | '状态' | '目标' | '元概念' | '未分类';

/** 关系类型：草案 8 种 */
export type RelationBlockKind =
  | '属于' | '对立' | '支撑' | '派生'
  | '约束' | '相似' | '因果' | '时序'
  | '其他';

export interface ConceptBlockDeclNode extends ASTNode {
  type: 'ConceptBlockDecl';
  name: string;
  kind: ConceptBlockKind;
  fields: Record<string, unknown>;
}

export interface PropositionBlockDeclNode extends ASTNode {
  type: 'PropositionBlockDecl';
  name: string;
  fields: Record<string, unknown>;
}

export interface RelationBlockDeclNode extends ASTNode {
  type: 'RelationBlockDecl';
  name: string;
  fields: Record<string, unknown>;
}

export interface ConceptBlockHistoryEntry {
  version: string;
  changed_at: string;
  note: string;
}

export interface ConceptBlockSpec {
  id: string;
  name: string;
  kind: ConceptBlockKind;
  /** 概念名称：默认等于 name，可被「名称」字段覆盖 */
  display_name: string;
  definition: string;
  core_propositions: string[];
  neighbors: string[];
  scope: string;
  failure_boundary: string;
  source: string;
  confidence: number;
  updated_at: string;
  /** 派生：被多少命题块/关系块引用 */
  proposition_count: number;
  relation_count: number;
  /** 0.7+ 挂载到的母体引擎名（来自 `母体 = 引擎名` 字段，可空） */
  matrix_engine: string;
  /** 派生：母体引擎是否在 IR 中存在 */
  matrix_resolved: boolean;
  /** 0.8 — 概念块版本号，默认 "1.0.0" */
  version: string;
  /** 0.8 — 变更历史链 */
  history: ConceptBlockHistoryEntry[];
  /** 0.8 — 状态标记，常用值："草案" / "已实施" / "已废弃"，可空 */
  status: string;
}

export interface PropositionBlockSpec {
  id: string;
  name: string;
  subject: string;
  predicate: string;
  object: string;
  assertion: string;
  source: string;
  confidence: number;
  updated_at: string;
  /** 派生：是否所有引用的概念都存在 */
  resolved: boolean;
  missing_refs: string[];
}

export interface RelationBlockSpec {
  id: string;
  name: string;
  source: string;
  target: string;
  kind: RelationBlockKind;
  strength: number;
  evidence_source: string;
  confidence: number;
  /** 派生：源/靶概念是否存在 */
  resolved: boolean;
  missing_refs: string[];
}

export interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SelectResult {
  result: string[];
  excluded: string[];
  reasons: Record<string, string[]>;
}

/** 0.8 — 规则触发的证据链项 */
export interface RuleEvidenceLink {
  rule_name: string;
  matched_conditions: string[];
  /** 命中的命题块/关系块/证据/概念块名（用于追溯） */
  evidence_refs: string[];
  action_summary: string;
}

export interface InferResult {
  returns: string[];
  labels: Record<string, string[]>;
  excluded: string[];
  /** 0.8 — 每个被规则作用的实体的证据链 */
  evidence_chains: Record<string, RuleEvidenceLink[]>;
}

export interface TraceResult {
  target: string;
  evidence_chain: Array<{
    source: string;
    snippet: string;
    supports: string[];
  }>;
}

export interface FunctionCallResult {
  function_name: string;
  args: Record<string, unknown>;
  result: unknown;
  trace: string[];
}
