import type {
  ProgramNode, ASTNode, IRContainer,
  ConceptNode, EntityNode, AttributeSpec, InvariantSpec,
  RuleSpec, EvidenceAnchor, ClauseSpec, ActionSpec,
  FunctionSpec, TemplateSpec, IfClause,
  ConceptDeclNode, EntityDeclNode, AttributeDeclNode,
  InlineInvariantNode, InvariantDeclNode, RuleDeclNode,
  EvidenceDeclNode, AssignmentExprNode, ConditionExprNode,
  FunctionDeclNode, IfExprNode, ActionExprNode,
  TemplateDeclNode, TemplateExpandNode,
  SubjectDeclNode, StageDeclNode, TransitionDeclNode,
  CompilerLayerDeclNode, RegenerationDeclNode, SignalDeclNode,
  MappingTableDeclNode, ClosureDeclNode, CorrespondenceChainDeclNode, DomainExpansionDeclNode,
  UnitDeclNode, EstablishmentDeclNode, ProfileDeclNode, TradeoffDeclNode,
  UnitSpec,
  EngineDeclNode, ModuleDeclNode, EngineActionDeclNode, AxisDeclNode,
  ConceptBlockDeclNode, PropositionBlockDeclNode, RelationBlockDeclNode,
  ConceptBlockSpec, PropositionBlockSpec, RelationBlockSpec, RelationBlockKind,
} from './types';


const OP_MAP: Record<string, string> = {
  '=': 'eq', '≠': 'neq', '!=': 'neq',
  '>': 'gt', '<': 'lt', '≥': 'gte', '≤': 'lte',
  '>=': 'gte', '<=': 'lte', '∈': 'in',
};

let counter = 0;
function genId(prefix: string): string {
  return `${prefix}_${++counter}`;
}

export function resetIdCounter() {
  counter = 0;
}

import type { CapabilityProfile } from './capability';
import type { IRBuildLogEntry } from './types';
import { IR_NODE_TO_FEATURE, extractNodeName } from './ir-builder/feature-map';
import { assertIRMetaComplete } from './ir-builder/meta-assert';

// H6: profile 必传 — 保证每个 IR 都有 _meta;消除 profile 漂移检查为死代码的可能
export function buildIR(ast: ProgramNode, profile: CapabilityProfile): IRContainer {
  resetIdCounter();
  const ir: IRContainer = {
    concepts: [], entities: [], attributes: [],
    relations: [], invariants: [], rules: [], evidences: [],
    functions: [], templates: [],
    subjects: [], stages: [], transitions: [],
    compiler_layers: [], regenerations: [], signals: [],
    mapping_tables: [], closures: [], correspondence_chains: [], domain_expansions: [],
    units: [], establishments: [], profiles: [], tradeoffs: [],
    engines: [], engine_modules: [], engine_actions: [], engine_axes: [],
    concept_blocks: [], proposition_blocks: [], relation_blocks: [],
  };

  // MVP-2: buildLog 在下方主循环中填充,meta 在循环结束后冻结注入
  const buildLog: IRBuildLogEntry[] = [];

  // MVP-2 主循环前置裁决:三道闸
  //   闸 A: v0.8 核心节点(feature === null) → 直接放行
  //   闸 B: 未登记节点类型(feature === undefined) → 拒绝,记 illegal,节点丢弃
  //   闸 C: profile 存在且 feature 关闭 → B 档降级,仅记 buildLog,不产节点
  //         (当前 parser 已在词法层兜住 95% 场景,本闸是双保险)
  //   闸 D: 正常构建 → 交给下方 switch
  //
  // 决策函数:返回 'accept' 才走 switch;其他决策只记日志并跳过。
  function gate(node: ASTNode): 'accept' | 'skip' {
    const feature = IR_NODE_TO_FEATURE[node.type];
    const nodeName = extractNodeName(node as never);

    // 闸 A: v0.8 核心
    if (feature === null) return 'accept';

    // 闸 B: 未登记
    if (feature === undefined) {
      buildLog.push({
        nodeType: node.type, nodeName, feature: 'unknown',
        decision: 'illegal',
        reason: `AST 节点类型「${node.type}」未在 IR feature-map 登记`,
      });
      return 'skip';
    }

    // 闸 C: profile 存在且 feature 关闭
    if (profile && !profile.featureFlags[feature]) {
      buildLog.push({
        nodeType: node.type, nodeName, feature,
        decision: 'disabled',
        reason: profile.featureDisabledReason[feature] || `feature「${feature}」被规格层关闭`,
      });
      return 'skip';
    }

    // 闸 D: 正常
    buildLog.push({
      nodeType: node.type, nodeName, feature,
      decision: 'accepted',
    });
    return 'accept';
  }


  const conceptIdMap: Record<string, string> = {};
  const templateMap: Record<string, TemplateDeclNode> = {};

  // First pass: collect names
  for (const node of ast.body) {
    if (node.type === 'ConceptDecl') {
      const cn = node as ConceptDeclNode;
      conceptIdMap[cn.name] = genId('concept');
    }
    if (node.type === 'TemplateDecl') {
      const tn = node as TemplateDeclNode;
      templateMap[tn.name] = tn;
    }
  }

  // Second pass: expand templates first (they generate new concepts)
  // gate 放行 TemplateExpand 才展开(feature: expand)
  for (const node of ast.body) {
    if (node.type === 'TemplateExpand') {
      if (gate(node) !== 'accept') continue;
      const expand = node as TemplateExpandNode;
      const template = templateMap[expand.template_name];
      if (template) {
        expandTemplate(template, expand, ir, conceptIdMap);
      }
    }
  }

  // Third pass: build IR(每个节点前置通过 gate 裁决)
  for (const node of ast.body) {
    // TemplateExpand 已在第二遍处理(含 gate),跳过避免重复日志
    if (node.type === 'TemplateExpand') continue;
    if (gate(node) !== 'accept') continue;
    switch (node.type) {
      case 'ConceptDecl':
        processConcept(node as ConceptDeclNode, ir, conceptIdMap);
        break;
      case 'EntityDecl':
        processEntity(node as EntityDeclNode, ir, conceptIdMap);
        break;
      case 'InvariantDecl':
        processInvariant(node as InvariantDeclNode, ir, conceptIdMap);
        break;
      case 'RuleDecl':
        processRule(node as RuleDeclNode, ir);
        break;
      case 'EvidenceDecl':
        processEvidence(node as EvidenceDeclNode, ir);
        break;
      case 'FunctionDecl':
        processFunction(node as FunctionDeclNode, ir);
        break;
      case 'TemplateDecl':
        processTemplate(node as TemplateDeclNode, ir);
        break;
      case 'SubjectDecl': {
        const n = node as SubjectDeclNode;
        ir.subjects.push({
          id: genId('subject'), name: n.name,
          current_stage: n.current_stage, attributes: n.attributes,
        });
        break;
      }
      case 'StageDecl': {
        const n = node as StageDeclNode;
        ir.stages.push({
          id: genId('stage'), name: n.name, index: n.index,
          keywords: n.keywords, description: n.description,
        });
        break;
      }
      case 'TransitionDecl': {
        const n = node as TransitionDeclNode;
        ir.transitions.push({
          id: genId('trans'), name: n.name,
          from_stage: n.from_stage, to_stage: n.to_stage,
          trigger: n.trigger ? toClause(n.trigger) : null,
        });
        break;
      }
      case 'CompilerLayerDecl': {
        const n = node as CompilerLayerDeclNode;
        ir.compiler_layers.push({
          id: genId('layer'), name: n.name, level: n.level,
          inputs: n.inputs, outputs: n.outputs,
        });
        break;
      }
      case 'RegenerationDecl': {
        const n = node as RegenerationDeclNode;
        ir.regenerations.push({
          id: genId('regen'), name: n.name, subject_ref: n.subject_ref,
          failure: n.failure, diagnosis: n.diagnosis,
          recompose: n.recompose, new_version: n.new_version,
        });
        break;
      }
      case 'SignalDecl': {
        const n = node as SignalDeclNode;
        ir.signals.push({
          id: genId('signal'), name: n.name, kind: n.kind,
          intensity: n.intensity, description: n.description,
        });
        break;
      }
      // 0.4
      case 'MappingTableDecl': {
        const n = node as MappingTableDeclNode;
        const misaligned = n.rows.filter(r => r.items.length !== n.columns.length).map(r => r.label);
        ir.mapping_tables.push({
          id: genId('maptbl'), name: n.name,
          columns: n.columns, rows: n.rows,
          aligned: misaligned.length === 0,
          misaligned_rows: misaligned,
        });
        break;
      }
      case 'ClosureDecl': {
        const n = node as ClosureDeclNode;
        const sum = n.parts.reduce((acc, p) => acc + p.value, 0);
        ir.closures.push({
          id: genId('closure'), name: n.name,
          total: n.total, parts: n.parts,
          computed_sum: sum, closed: sum === n.total,
        });
        break;
      }
      case 'CorrespondenceChainDecl': {
        const n = node as CorrespondenceChainDeclNode;
        ir.correspondence_chains.push({
          id: genId('chain'), name: n.name,
          domains: n.domains, items: n.items,
          aligned: n.items.length === n.domains.length,
        });
        break;
      }
      case 'DomainExpansionDecl': {
        const n = node as DomainExpansionDeclNode;
        const derived: string[] = [];
        for (const f of n.factors) {
          for (const item of f.items) derived.push(`${f.domain}·${item}`);
        }
        ir.domain_expansions.push({
          id: genId('domexp'), name: n.name,
          mother_law_values: n.mother_law_values,
          domains: n.domains, factors: n.factors,
          derived_concept_names: derived,
        });
        break;
      }
      // 0.5
      case 'UnitDecl': {
        const n = node as UnitDeclNode;
        const net = n.value_score - n.cost_score;
        const hi_v = n.value_score >= 6;
        const hi_c = n.cost_score >= 6;
        const quadrant = hi_v && !hi_c ? '高价值低代价'
          : hi_v && hi_c ? '高价值高代价'
          : !hi_v && !hi_c ? '低价值低代价'
          : '低价值高代价';
        ir.units.push({
          id: genId('unit'), name: n.name,
          layer: n.layer, module: n.module,
          definition: n.definition, trigger: n.trigger,
          value: n.value, cost: n.cost,
          value_score: n.value_score, cost_score: n.cost_score,
          net_score: net, quadrant,
        });
        break;
      }
      case 'EstablishmentDecl': {
        const n = node as EstablishmentDeclNode;
        ir.establishments.push({
          id: genId('est'), name: n.name,
          // actual 字段先占位为 0，待所有声明处理完后再回填
          layers: Object.entries(n.layers).map(([label, declared]) => ({
            label, declared, actual: 0, matched: false,
          })),
          declared_total: n.total,
          actual_total: 0,
          total_matched: false,
        });
        break;
      }
      case 'ProfileDecl': {
        const n = node as ProfileDeclNode;
        ir.profiles.push({
          id: genId('prof'), name: n.name,
          lower: n.lower, upper: n.upper,
          description: n.description,
          activated_units: [], // 后回填
        });
        break;
      }
      case 'TradeoffDecl': {
        const n = node as TradeoffDeclNode;
        ir.tradeoffs.push({
          id: genId('trd'), name: n.name,
          unit_names: n.units,
          value_threshold: n.value_threshold,
          cost_threshold: n.cost_threshold,
          total_value: 0, total_cost: 0,
          green_units: [], red_units: [],
        });
        break;
      }
      // 0.6 — 数字文明母体引擎
      case 'EngineDecl': {
        const n = node as EngineDeclNode;
        ir.engines.push({
          id: genId('eng'), name: n.name, kind: n.kind,
          position: n.position, constraint: n.constraint,
          module_count: 0, action_count: 0, axis_count: 0,
        });
        break;
      }
      case 'ModuleDecl': {
        const n = node as ModuleDeclNode;
        ir.engine_modules.push({
          id: genId('mod'), name: n.name, engine_ref: n.engine_ref,
          responsibility: n.responsibility, inputs: n.inputs, outputs: n.outputs,
        });
        break;
      }
      case 'EngineActionDecl': {
        const n = node as EngineActionDeclNode;
        ir.engine_actions.push({
          id: genId('act'), name: n.name, engine_ref: n.engine_ref,
          trigger: n.trigger, pre: n.pre, post: n.post, cost: n.cost,
        });
        break;
      }
      case 'AxisDecl': {
        const n = node as AxisDeclNode;
        ir.engine_axes.push({
          id: genId('axis'), name: n.name, engine_ref: n.engine_ref,
          index: n.index, meaning: n.meaning, effect: n.effect,
        });
        break;
      }
      // 0.7 — 概念级 AI 长期记忆块
      case 'ConceptBlockDecl': {
        const n = node as ConceptBlockDeclNode;
        const f = n.fields;
        const rawHistory = Array.isArray(f['历史']) ? (f['历史'] as string[]) : [];
        const history = rawHistory.map((entry) => {
          // 形如 "1.0.0|2025-04-19|首次发布" 或 "1.0.0:首次发布"
          const parts = String(entry).split(/[|:]/).map(s => s.trim());
          return {
            version: parts[0] ?? '',
            changed_at: parts[1] ?? '',
            note: parts[2] ?? parts[1] ?? '',
          };
        });
        ir.concept_blocks.push({
          id: genId('cblk'),
          name: n.name,
          kind: n.kind,
          display_name: String(f['名称'] ?? n.name),
          definition: String(f['定义'] ?? ''),
          core_propositions: (f['核心命题'] as string[]) || [],
          neighbors: (f['相邻概念'] as string[]) || [],
          scope: String(f['适用范围'] ?? ''),
          failure_boundary: String(f['失效边界'] ?? ''),
          source: String(f['来源'] ?? ''),
          confidence: typeof f['置信度'] === 'number' ? (f['置信度'] as number) : 1,
          updated_at: String(f['更新时间'] ?? ''),
          proposition_count: 0,
          relation_count: 0,
          matrix_engine: String(f['母体'] ?? ''),
          matrix_resolved: false,
          version: String(f['版本'] ?? '1.0.0'),
          history,
          status: String(f['状态'] ?? ''),
        });
        break;
      }
      case 'PropositionBlockDecl': {
        const n = node as PropositionBlockDeclNode;
        const f = n.fields;
        ir.proposition_blocks.push({
          id: genId('pblk'),
          name: n.name,
          subject: String(f['主语'] ?? ''),
          predicate: String(f['谓语'] ?? ''),
          object: String(f['宾语'] ?? ''),
          assertion: String(f['断言'] ?? ''),
          source: String(f['来源'] ?? ''),
          confidence: typeof f['置信度'] === 'number' ? (f['置信度'] as number) : 1,
          updated_at: String(f['更新时间'] ?? ''),
          resolved: false,
          missing_refs: [],
        });
        break;
      }
      case 'RelationBlockDecl': {
        const n = node as RelationBlockDeclNode;
        const f = n.fields;
        const validKinds: RelationBlockKind[] = ['属于','对立','支撑','派生','约束','相似','因果','时序','其他'];
        const rawKind = String(f['关系类型'] ?? '其他');
        const kind: RelationBlockKind = (validKinds as string[]).includes(rawKind)
          ? (rawKind as RelationBlockKind) : '其他';
        ir.relation_blocks.push({
          id: genId('rblk'),
          name: n.name,
          source: String(f['源'] ?? ''),
          target: String(f['靶'] ?? ''),
          kind,
          strength: typeof f['强度'] === 'number' ? (f['强度'] as number) : 1,
          evidence_source: String(f['来源'] ?? ''),
          confidence: typeof f['置信度'] === 'number' ? (f['置信度'] as number) : 1,
          resolved: false,
          missing_refs: [],
        });
        break;
      }
    }
  }

  // ===== 0.5 派生计算（在所有 unit / establishment / profile / tradeoff 都收集完成后） =====

  // 1) 编制：用 ir.units 回填实际数 & 校验
  for (const est of ir.establishments) {
    for (const layer of est.layers) {
      layer.actual = ir.units.filter(u => u.layer === layer.label).length;
      layer.matched = layer.actual === layer.declared;
    }
    est.actual_total = ir.units.length;
    est.total_matched = est.declared_total === null ? true : est.actual_total === est.declared_total;
  }

  // 2) 档位：按净分排序，取前 upper 个；提示前 lower 个为常驻
  const sortedByNet = [...ir.units].sort((a, b) => b.net_score - a.net_score);
  for (const prof of ir.profiles) {
    prof.activated_units = sortedByNet.slice(0, prof.upper).map(u => u.name);
  }

  // 3) 权衡：聚合 + 阈值红绿分类
  for (const tr of ir.tradeoffs) {
    const targetUnits: UnitSpec[] = tr.unit_names.length === 0
      ? ir.units
      : ir.units.filter(u => tr.unit_names.includes(u.name));
    tr.total_value = targetUnits.reduce((s, u) => s + u.value_score, 0);
    tr.total_cost = targetUnits.reduce((s, u) => s + u.cost_score, 0);
    for (const u of targetUnits) {
      const okV = tr.value_threshold === null || u.value_score >= tr.value_threshold;
      const okC = tr.cost_threshold === null || u.cost_score <= tr.cost_threshold;
      if (okV && okC) tr.green_units.push(u.name);
      // 红：低于价值阈值 且 高于代价阈值（双失）
      const badV = tr.value_threshold !== null && u.value_score < tr.value_threshold;
      const badC = tr.cost_threshold !== null && u.cost_score > tr.cost_threshold;
      if (badV && badC) tr.red_units.push(u.name);
    }
  }

  // 4) 0.6 引擎：回填模块/动作/轴数量
  for (const eng of ir.engines) {
    eng.module_count = ir.engine_modules.filter(m => m.engine_ref === eng.name).length;
    eng.action_count = ir.engine_actions.filter(a => a.engine_ref === eng.name).length;
    eng.axis_count = ir.engine_axes.filter(x => x.engine_ref === eng.name).length;
  }

  // 5) 0.7 概念块：解析命题/关系块的引用 + 回填计数
  const cblkNames = new Set(ir.concept_blocks.map(c => c.name));
  for (const p of ir.proposition_blocks) {
    const missing: string[] = [];
    if (p.subject && !cblkNames.has(p.subject)) missing.push(p.subject);
    if (p.object && !cblkNames.has(p.object)) missing.push(p.object);
    p.missing_refs = missing;
    p.resolved = missing.length === 0;
  }
  for (const r of ir.relation_blocks) {
    const missing: string[] = [];
    if (r.source && !cblkNames.has(r.source)) missing.push(r.source);
    if (r.target && !cblkNames.has(r.target)) missing.push(r.target);
    r.missing_refs = missing;
    r.resolved = missing.length === 0;
  }
  const engineNames = new Set(ir.engines.map(e => e.name));
  for (const c of ir.concept_blocks) {
    c.proposition_count = ir.proposition_blocks.filter(p => p.subject === c.name || p.object === c.name).length;
    c.relation_count = ir.relation_blocks.filter(r => r.source === c.name || r.target === c.name).length;
    c.matrix_resolved = !!c.matrix_engine && engineNames.has(c.matrix_engine);
  }

  // H6: profile 现在必传,_meta 强制写入(不再有 profile==null 的兼容分支)
  ir._meta = {
    profileId: profile.id,
    grammarVersion: profile.grammarVersion,
    specVersion: profile.specVersion,
    compilerVersion: profile.compilerVersion,
    osePolicyVersion: profile.osePolicyVersion,
    sourceSpecId: profile.specVersion,
    featureFlags: { ...profile.featureFlags },
    enabledFeatures: Object.entries(profile.featureFlags)
      .filter(([, on]) => on).map(([k]) => k),
    enabledModes: [...profile.enabledModes],
    osePolicySet: {
      version: profile.osePolicyVersion,
      enabledHooks: [...profile.osePolicies.enabledHooks],
      blockingHooks: [...profile.osePolicies.blockingHooks],
    },
    buildLog,
    builtAt: new Date().toISOString(),
  };

  // P1: _meta 完整性硬检查 — 缺字段直接抛错,不允许静默通过
  assertIRMetaComplete(ir);

  return ir;
}

function normalizeOp(op: string): string {
  return OP_MAP[op] || op;
}

function toClause(expr: ConditionExprNode): ClauseSpec {
  return { left: expr.left, op: normalizeOp(expr.op), right: expr.right };
}

function processConcept(node: ConceptDeclNode, ir: IRContainer, idMap: Record<string, string>) {
  const id = idMap[node.name];
  const concept: ConceptNode = {
    id,
    name: node.name,
    parent_id: node.parent ? (idMap[node.parent] || null) : null,
    attribute_ids: [],
    invariant_ids: [],
  };

  for (const child of node.body) {
    if (child.type === 'AttributeDecl') {
      const attr = child as AttributeDeclNode;
      const attrId = genId('attr');
      ir.attributes.push({
        id: attrId,
        owner_id: id,
        name: attr.name,
        value_type: attr.value_type,
        unit: (attr.type_args.unit as string) || (attr.type_args['单位'] as string) || null,
        enum_values: (attr.type_args.values as string[]) || [],
      });
      concept.attribute_ids.push(attrId);
    } else if (child.type === 'InlineInvariant') {
      const inv = child as InlineInvariantNode;
      const invId = genId('inv');
      ir.invariants.push({
        id: invId,
        name: `${node.name}_inline_inv`,
        scope_id: id,
        clauses: [toClause(inv.expr)],
      });
      concept.invariant_ids.push(invId);
    }
  }

  ir.concepts.push(concept);
}

function processEntity(node: EntityDeclNode, ir: IRContainer, idMap: Record<string, string>) {
  const id = genId('entity');
  const values: Record<string, unknown> = {};
  for (const child of node.body) {
    if (child.type === 'AssignmentExpr') {
      const assign = child as AssignmentExprNode;
      values[assign.target] = assign.value;
    }
  }
  ir.entities.push({
    id,
    name: node.name,
    concept_id: idMap[node.concept] || node.concept,
    values,
    relation_ids: [],
    evidence_ids: [],
  });
}

function processInvariant(node: InvariantDeclNode, ir: IRContainer, idMap: Record<string, string>) {
  const id = genId('inv');
  ir.invariants.push({
    id,
    name: node.name,
    scope_id: idMap[node.scope] || node.scope,
    clauses: node.clauses.map(toClause),
  });
}

function processRule(node: RuleDeclNode, ir: IRContainer) {
  const id = genId('rule');
  ir.rules.push({
    id,
    name: node.name,
    conditions: node.conditions.map(toClause),
    actions: node.actions.map(a => ({
      action_type: a.action_type,
      payload: a.payload,
    } as ActionSpec)),
    priority: node.priority,
  });
}

function processEvidence(node: EvidenceDeclNode, ir: IRContainer) {
  const id = genId('evidence');
  ir.evidences.push({
    id,
    name: node.name,
    source: node.source,
    snippet: node.snippet,
    supports: node.supports,
  });
}

// ==================== New: Function → IR ====================

function processFunction(node: FunctionDeclNode, ir: IRContainer) {
  const id = genId('func');
  const body: Array<IfClause | ActionSpec> = [];

  for (const child of node.body) {
    if (child.type === 'IfExpr') {
      const ifNode = child as IfExprNode;
      // Main if
      body.push({
        condition: toClause(ifNode.condition),
        actions: flattenActions(ifNode.then_branch),
      });
      // Else-if
      for (const elif of ifNode.else_if_branches) {
        body.push({
          condition: toClause(elif.condition),
          actions: flattenActions(elif.body),
        });
      }
      // Else (with always-true condition)
      if (ifNode.else_branch.length > 0) {
        body.push({
          condition: { left: '_always', op: 'eq', right: true },
          actions: flattenActions(ifNode.else_branch),
        });
      }
    } else if (child.type === 'ActionExpr') {
      const a = child as ActionExprNode;
      body.push({ action_type: a.action_type, payload: a.payload });
    }
  }

  ir.functions.push({ id, name: node.name, params: node.params, body });
}

function flattenActions(nodes: ASTNode[]): ActionSpec[] {
  const actions: ActionSpec[] = [];
  for (const n of nodes) {
    if (n.type === 'ActionExpr') {
      const a = n as ActionExprNode;
      actions.push({ action_type: a.action_type, payload: a.payload });
    } else if (n.type === 'IfExpr') {
      // Nested if — serialize as special action
      const ifNode = n as IfExprNode;
      actions.push({
        action_type: 'conditional',
        payload: {
          condition: toClause(ifNode.condition),
          then_actions: flattenActions(ifNode.then_branch),
          else_actions: flattenActions(ifNode.else_branch),
        },
      });
    }
  }
  return actions;
}

// ==================== New: Template → IR ====================

function processTemplate(node: TemplateDeclNode, ir: IRContainer) {
  const id = genId('template');
  ir.templates.push({
    id,
    name: node.name,
    type_params: node.type_params,
    body_ast: node.body,
  });
}

function expandTemplate(
  template: TemplateDeclNode,
  expand: TemplateExpandNode,
  ir: IRContainer,
  idMap: Record<string, string>,
) {
  // Create a concept from the template with type params substituted
  const paramMap: Record<string, string> = {};
  for (let i = 0; i < template.type_params.length; i++) {
    paramMap[template.type_params[i]] = expand.type_args[i] || template.type_params[i];
  }

  const conceptName = expand.target_name;
  const conceptId = genId('concept');
  idMap[conceptName] = conceptId;

  const concept: ConceptNode = {
    id: conceptId,
    name: conceptName,
    parent_id: null,
    attribute_ids: [],
    invariant_ids: [],
  };

  for (const child of template.body) {
    if (child.type === 'AttributeDecl') {
      const attr = child as AttributeDeclNode;
      const attrId = genId('attr');
      // Substitute type params in value_type
      let valueType = attr.value_type;
      for (const [param, arg] of Object.entries(paramMap)) {
        valueType = valueType.replace(param, arg);
      }
      // Substitute in name
      let attrName = attr.name;
      for (const [param, arg] of Object.entries(paramMap)) {
        attrName = attrName.replace(param, arg);
      }

      ir.attributes.push({
        id: attrId,
        owner_id: conceptId,
        name: attrName,
        value_type: valueType,
        unit: (attr.type_args.unit as string) || null,
        enum_values: (attr.type_args.values as string[]) || [],
      });
      concept.attribute_ids.push(attrId);
    }
  }

  ir.concepts.push(concept);
}
