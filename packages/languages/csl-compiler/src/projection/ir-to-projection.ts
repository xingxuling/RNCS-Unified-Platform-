// CSL 全栈投影 — IR → FrontendProjection / BackendProjection
// Phase 2.0:支持多视图、多主概念、多 endpoint
// Phase 2.1:新增 stage 模式视图(主体 + 阶段 + 转移 + 信号 + 再生事件)
// 兼容策略:.cslapp 未声明视图时,自动构造一个默认 ViewDecl(走 Phase 1 行为)

import type {
  IRContainer, ConceptNode, AttributeSpec, InvariantSpec, RuleSpec, ClauseSpec,
} from '../types';
import type {
  AppManifest, FrontendProjection, BackendProjection,
  FormField, InvariantCheck, RuleEvaluation, ProjectionDiagnostic,
  ViewDecl, ViewProjection, EndpointProjection, RouteEntry,
  StageTimelineItem, SignalOption, RegenerationPreview, StageTransitionRule,
  BlockNetworkSnapshot, BlockNodeView, PropositionEdgeView, RelationEdgeView,
  MappingViewSnapshot, MappingTableView, ClosureView, ChainView, DomainExpansionView,
  DerivedFieldSpec,
} from './types';

// ---------- 标识符工具 ----------

function toComponentName(input: string, suffix = 'View'): string {
  const cleaned = input.replace(/[^A-Za-z0-9_\u4e00-\u9fa5]/g, '');
  if (/^[A-Za-z]/.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + suffix;
  }
  return 'CSL' + suffix + '_' + Math.abs(hashCode(cleaned)).toString(36);
}

function toAppComponentName(input: string): string {
  const cleaned = input.replace(/[^A-Za-z0-9_\u4e00-\u9fa5]/g, '');
  if (/^[A-Za-z]/.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + 'App';
  }
  return 'CSLApp_' + Math.abs(hashCode(cleaned)).toString(36);
}

function toEndpointSlug(input: string): string {
  const ascii = input.replace(/[^A-Za-z0-9]/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (ascii) return `/api/${ascii}`;
  return `/api/csl-${Math.abs(hashCode(input)).toString(36)}`;
}

function toHandlerName(viewId: string): string {
  const cn = toComponentName(viewId, '');
  return 'handle' + cn;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

// ---------- 字段类型推断 ----------

function attrTypeToFieldKind(attrType: string): 'text' | 'number' {
  if (attrType === '数值' || attrType === 'number') return 'number';
  return 'text';
}

function attrTypeToBackendType(attrType: string): 'string' | 'number' {
  if (attrType === '数值' || attrType === 'number') return 'number';
  return 'string';
}

function conceptToFormFields(concept: ConceptNode, attributes: AttributeSpec[]): FormField[] {
  const conceptAttrs = attributes.filter(a => a.owner_id === concept.id);
  return conceptAttrs.map(a => {
    const kind = attrTypeToFieldKind(a.value_type);
    return {
      name: a.name, label: a.name, kind,
      required: true,
      defaultValue: kind === 'number' ? 0 : '',
    };
  });
}

// ---------- Clause → JS 表达式 ----------

function clauseToJs(c: ClauseSpec, knownFields: Set<string>): string {
  let left = String(c.left || '').trim();
  left = left.replace(/^候选[.·]/, '');
  const leftJs = knownFields.has(left)
    ? `input[${JSON.stringify(left)}]`
    : isNumericLiteral(left) ? left
    : isStringLiteral(left) ? left
    : JSON.stringify(left);

  const right = c.right;
  let rightJs: string;
  if (typeof right === 'number') rightJs = String(right);
  else if (typeof right === 'boolean') rightJs = String(right);
  else if (right == null) rightJs = 'null';
  else {
    const rs = String(right).trim();
    if (isNumericLiteral(rs)) rightJs = rs;
    else if (isStringLiteral(rs)) rightJs = rs;
    else if (knownFields.has(rs)) rightJs = `input[${JSON.stringify(rs)}]`;
    else rightJs = JSON.stringify(rs);
  }

  const op = normalizeOp(c.op);
  return `${leftJs} ${op} ${rightJs}`;
}

function normalizeOp(op: string): string {
  const t = (op || '').trim().toLowerCase();
  if (t === 'gt')  return '>';
  if (t === 'gte' || t === 'ge') return '>=';
  if (t === 'lt')  return '<';
  if (t === 'lte' || t === 'le') return '<=';
  if (t === 'eq'  || t === '=' || t === '==') return '===';
  if (t === 'neq' || t === 'ne' || t === '!=' || t === '≠') return '!==';
  if (t === 'in') return 'in';
  if (t === '≥') return '>=';
  if (t === '≤') return '<=';
  return t || '===';
}

function isNumericLiteral(s: string): boolean { return /^-?\d+(\.\d+)?$/.test(s); }
function isStringLiteral(s: string): boolean { return /^["'].*["']$/.test(s); }

function clausesToJs(clauses: ClauseSpec[], knownFields: Set<string>): string {
  const meaningful = clauses.filter(c => {
    const op = normalizeOp(c.op);
    if (op === 'in') return false;
    const left = String(c.left || '').replace(/^候选[.·]?/, '').trim();
    if (!left || left === '候选') return false;
    return true;
  });
  if (meaningful.length === 0) return 'true';
  return meaningful.map(c => `(${clauseToJs(c, knownFields)})`).join(' && ');
}

// ---------- 不变量过滤:仅保留作用于该概念字段的 ----------

function invariantAppliesToConcept(inv: InvariantSpec, conceptFieldNames: Set<string>): boolean {
  if (!inv.clauses || inv.clauses.length === 0) return false;
  return inv.clauses.some(c => {
    const left = String(c.left || '').replace(/^候选[.·]?/, '').trim();
    return conceptFieldNames.has(left);
  });
}

function invariantsToChecks(invariants: InvariantSpec[], knownFields: Set<string>): InvariantCheck[] {
  return invariants.map(inv => ({
    name: inv.name || '匿名不变量',
    jsExpression: clausesToJs(inv.clauses || [], knownFields),
    failureMessage: `${inv.name || '匿名不变量'} 失败`,
  }));
}

// ---------- 规则过滤:仅保留作用于该概念的 ----------

function ruleAppliesToConcept(rule: RuleSpec, conceptName: string, conceptFieldNames: Set<string>): boolean {
  for (const c of rule.conditions || []) {
    // 候选 ∈ 概念名
    const op = normalizeOp(c.op);
    if (op === 'in') {
      const right = String(c.right ?? '').trim();
      if (right === conceptName) return true;
    }
    // 字段引用
    const left = String(c.left || '').replace(/^候选[.·]?/, '').trim();
    if (conceptFieldNames.has(left)) return true;
  }
  return false;
}

function ruleToEvaluation(rule: RuleSpec, knownFields: Set<string>): RuleEvaluation {
  const js = clausesToJs(rule.conditions || [], knownFields);
  let markLabel = rule.name || '已触发';
  for (const a of rule.actions || []) {
    const p = a.payload || {};
    const label = (p.label ?? p.value ?? p.text ?? p.message);
    if (typeof label === 'string' && label.trim()) {
      markLabel = label.trim().replace(/^["“”]|["“”]$/g, '');
      break;
    }
  }
  return { name: rule.name || '匿名规则', jsCondition: js, markLabel };
}

// ---------- 单视图投影:核心复用单元 ----------

interface ProjectViewArgs {
  ir: IRContainer;
  view: ViewDecl;
  diagnostics: ProjectionDiagnostic[];
}

interface ProjectViewResult {
  viewProjection: ViewProjection;
  endpointProjection: EndpointProjection;
}

// ---------- stage 模式投影:主体状态机 ----------

function transitionToJs(t: { trigger: ClauseSpec | null }, signalNames: Set<string>): { js: string; raw: string } {
  if (!t.trigger) return { js: 'true', raw: '(无条件)' };
  const c = t.trigger;
  const left = String(c.left || '').replace(/^候选[.·]?/, '').trim();
  const op = normalizeOp(c.op);
  const right = c.right;
  let rightJs: string;
  const rs = right == null ? '' : String(right).trim();
  if (typeof right === 'number') rightJs = String(right);
  else if (isNumericLiteral(rs)) rightJs = rs;
  else if (isStringLiteral(rs)) rightJs = rs;
  else rightJs = JSON.stringify(rs);

  // 触发条件中的 left 被视作信号名:input.信号强度[left] 或 input.intensity
  // 简化:input["__signal_intensity__"] 表示当前注入信号的强度,input["__signal_name__"] 表示信号名
  // 同时支持 left 直接作为信号字段,允许多信号场景:input[left]
  const leftJs = signalNames.has(left)
    ? `(input[${JSON.stringify(left)}] ?? 0)`
    : `(input[${JSON.stringify(left)}] ?? input["__signal_intensity__"] ?? 0)`;
  const raw = `${left} ${c.op || op} ${rs}`;
  return { js: `${leftJs} ${op} ${rightJs}`, raw };
}

function projectStageView({ ir, view, diagnostics }: ProjectViewArgs): ProjectViewResult | null {
  // 1. 主体
  const subject = view.subjectRef
    ? ir.subjects.find(s => s.name === view.subjectRef)
    : ir.subjects[0];
  if (!subject) {
    diagnostics.push({
      level: 'error',
      message: `stage 视图「${view.id}」找不到主体「${view.subjectRef || '(任意)'}」,请检查 .csl 中是否声明了 主体 X { ... }`,
    });
    return null;
  }

  // 2. 阶段时间线(按 index 排序)
  const stagesSorted = [...ir.stages].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const stageTimeline: StageTimelineItem[] = stagesSorted.map(s => ({
    id: s.id, name: s.name, index: s.index,
    keywords: s.keywords, description: s.description,
    current: s.name === subject.current_stage,
  }));

  // 3. 信号清单
  const availableSignals: SignalOption[] = ir.signals.map(s => ({
    id: s.id, name: s.name, kind: s.kind, intensity: s.intensity, description: s.description,
  }));
  const signalNames = new Set(availableSignals.map(s => s.name));

  // 4. 阶段转移规则 → JS
  const stageTransitions: StageTransitionRule[] = ir.transitions.map(t => {
    const { js, raw } = transitionToJs(t, signalNames);
    return {
      id: t.id, name: t.name,
      fromStage: t.from_stage, toStage: t.to_stage,
      jsCondition: js, rawTrigger: raw,
    };
  });

  // 5. 再生事件预览(按 subject_ref 过滤;空 subject_ref 视为通用)
  const regenerationPreviews: RegenerationPreview[] = ir.regenerations
    .filter(r => !r.subject_ref || r.subject_ref === subject.name)
    .map(r => ({
      id: r.id, name: r.name,
      failure: r.failure, diagnosis: r.diagnosis,
      recompose: r.recompose, newVersion: r.new_version,
    }));

  // 6. inputSchema:接受 信号名(string) + 信号强度(number) + 当前阶段(string)
  const inputSchema: Record<string, 'string' | 'number'> = {
    __signal_name__: 'string',
    __signal_intensity__: 'number',
    __current_stage__: 'string',
  };
  for (const s of availableSignals) {
    inputSchema[s.name] = 'number';
  }

  const componentName = toComponentName(view.id);
  const handlerName = toHandlerName(view.id);

  const viewProjection: ViewProjection = {
    id: view.id, path: view.path, mode: 'stage',
    componentName, pageTitle: view.title,
    primaryConcept: view.primaryConcept,
    subjectRef: subject.name,
    formFields: [],
    endpoint: view.endpoint, method: view.method || 'POST',
    stageTimeline, availableSignals, regenerationPreviews,
  };

  const endpointProjection: EndpointProjection = {
    handlerName, endpoint: view.endpoint,
    method: view.method || 'POST',
    viewId: view.id, primaryConcept: view.primaryConcept,
    inputSchema,
    invariantChecks: [], ruleEvaluations: [],
    stageKind: 'transition',
    subjectRef: subject.name,
    defaultStage: subject.current_stage || stagesSorted[0]?.name || '',
    stageTransitions,
    regenerationsForSubject: regenerationPreviews.map(r => r.name),
  };

  diagnostics.push({
    level: 'info',
    message: `stage 视图「${view.id}」已投影: 主体=${subject.name}, ${stageTimeline.length} 阶段, ${availableSignals.length} 信号, ${stageTransitions.length} 转移, ${regenerationPreviews.length} 再生事件`,
  });

  return { viewProjection, endpointProjection };
}

function projectOneView({ ir, view, diagnostics }: ProjectViewArgs): ProjectViewResult | null {
  if (view.mode === 'stage') {
    return projectStageView({ ir, view, diagnostics });
  }
  if (view.mode === 'blocks') {
    return projectBlocksView({ ir, view, diagnostics });
  }
  if (view.mode === 'mapping') {
    return projectMappingView({ ir, view, diagnostics });
  }
  // form / summary 模式 — 复用原逻辑
  return projectFormOrSummaryView({ ir, view, diagnostics });
}

// ---------- Phase 2.3:concept_blocks / proposition_blocks / relation_blocks 投影 ----------

function projectBlocksView({ ir, view, diagnostics }: ProjectViewArgs): ProjectViewResult | null {
  const nodes: BlockNodeView[] = ir.concept_blocks.map(c => ({
    id: c.id, name: c.name, kind: c.kind,
    definition: c.definition, scope: c.scope,
    propositionCount: c.proposition_count,
    relationCount: c.relation_count,
  }));
  const propositions: PropositionEdgeView[] = ir.proposition_blocks.map(p => ({
    id: p.id, name: p.name,
    subject: p.subject, predicate: p.predicate, object: p.object,
    assertion: p.assertion, resolved: p.resolved,
  }));
  const relations: RelationEdgeView[] = ir.relation_blocks.map(r => ({
    id: r.id, name: r.name,
    source: r.source, target: r.target, kind: r.kind,
    strength: r.strength, resolved: r.resolved,
  }));

  // ===== blocks 视图专属问题定义检查(不再依赖 primaryConcept) =====
  // 1. 网络非空
  if (nodes.length === 0) {
    diagnostics.push({
      level: 'error',
      message: `[blocks/${view.id}] 概念块网络为空,.csl 中未声明任何「概念块」`,
    });
    return null;
  }
  // 2. rootBlock 锚点存在性(未指定时回退到第一个块)
  const nodeNameSet = new Set(nodes.map(n => n.name));
  let rootBlock = view.rootBlock;
  if (rootBlock && !nodeNameSet.has(rootBlock)) {
    diagnostics.push({
      level: 'error',
      message: `[blocks/${view.id}] 根块「${rootBlock}」未在 concept_blocks 中定义`,
    });
    return null;
  }
  if (!rootBlock) rootBlock = nodes[0].name;

  // 派生:孤立节点 + 悬空引用
  const referencedNames = new Set<string>();
  ir.proposition_blocks.forEach(p => { if (p.subject) referencedNames.add(p.subject); if (p.object) referencedNames.add(p.object); });
  ir.relation_blocks.forEach(r => { if (r.source) referencedNames.add(r.source); if (r.target) referencedNames.add(r.target); });
  const isolatedNodes = nodes.filter(n => !referencedNames.has(n.name) && n.name !== rootBlock).map(n => n.name);
  const danglingRefs: string[] = [];
  ir.proposition_blocks.forEach(p => {
    if (p.subject && !nodeNameSet.has(p.subject)) danglingRefs.push(`${p.name}.主语→${p.subject}`);
    if (p.object && !nodeNameSet.has(p.object)) danglingRefs.push(`${p.name}.宾语→${p.object}`);
  });
  ir.relation_blocks.forEach(r => {
    if (r.source && !nodeNameSet.has(r.source)) danglingRefs.push(`${r.name}.源→${r.source}`);
    if (r.target && !nodeNameSet.has(r.target)) danglingRefs.push(`${r.name}.靶→${r.target}`);
  });

  // 3. 悬空引用 → error;孤立块 → warn(展示但提示)
  if (danglingRefs.length > 0) {
    diagnostics.push({
      level: 'error',
      message: `[blocks/${view.id}] 命题/关系存在悬空引用 ${danglingRefs.length} 条:${danglingRefs.slice(0, 3).join(', ')}${danglingRefs.length > 3 ? ' ...' : ''}`,
    });
  }
  if (isolatedNodes.length > 0) {
    diagnostics.push({
      level: 'warn',
      message: `[blocks/${view.id}] 存在孤立块 ${isolatedNodes.length} 个(未被任何命题/关系引用):${isolatedNodes.join(', ')}`,
    });
  }

  const blockNetwork: BlockNetworkSnapshot = {
    nodes, propositions, relations, isolatedNodes, danglingRefs,
  };

  const componentName = toComponentName(view.id);
  const handlerName = toHandlerName(view.id);

  const viewProjection: ViewProjection = {
    id: view.id, path: view.path, mode: 'blocks',
    componentName, pageTitle: view.title,
    primaryConcept: view.primaryConcept,
    rootBlock,
    formFields: [],
    endpoint: view.endpoint, method: view.method || 'GET',
    blockNetwork,
  };
  const endpointProjection: EndpointProjection = {
    handlerName, endpoint: view.endpoint,
    method: view.method || 'GET',
    viewId: view.id, primaryConcept: view.primaryConcept,
    inputSchema: {},
    invariantChecks: [], ruleEvaluations: [],
  };
  diagnostics.push({
    level: 'info',
    message: `[blocks/${view.id}] 已投影: 根块=${rootBlock}, ${nodes.length} 概念块, ${propositions.length} 命题, ${relations.length} 关系`,
  });
  return { viewProjection, endpointProjection };
}

// ---------- Phase 2.3:mapping_tables / closures / correspondence_chains / domain_expansions 投影 ----------

function projectMappingView({ ir, view, diagnostics }: ProjectViewArgs): ProjectViewResult | null {
  const tables: MappingTableView[] = ir.mapping_tables.map(t => ({
    id: t.id, name: t.name, columns: t.columns, rows: t.rows,
    aligned: t.aligned, misalignedRows: t.misaligned_rows,
  }));
  const closures: ClosureView[] = ir.closures.map(c => ({
    id: c.id, name: c.name, total: c.total,
    computedSum: c.computed_sum, closed: c.closed, parts: c.parts,
  }));
  const chains: ChainView[] = ir.correspondence_chains.map(c => ({
    id: c.id, name: c.name, domains: c.domains, items: c.items, aligned: c.aligned,
  }));
  const expansions: DomainExpansionView[] = ir.domain_expansions.map(e => ({
    id: e.id, name: e.name,
    motherLawValues: e.mother_law_values,
    domains: e.domains, factors: e.factors,
    derivedConceptNames: e.derived_concept_names,
  }));
  const mappingSnapshot: MappingViewSnapshot = { tables, closures, chains, expansions };

  const componentName = toComponentName(view.id);
  const handlerName = toHandlerName(view.id);

  const viewProjection: ViewProjection = {
    id: view.id, path: view.path, mode: 'mapping',
    componentName, pageTitle: view.title,
    primaryConcept: view.primaryConcept,
    formFields: [],
    endpoint: view.endpoint, method: view.method || 'GET',
    mappingSnapshot,
  };
  const endpointProjection: EndpointProjection = {
    handlerName, endpoint: view.endpoint,
    method: view.method || 'GET',
    viewId: view.id, primaryConcept: view.primaryConcept,
    inputSchema: {},
    invariantChecks: [], ruleEvaluations: [],
  };
  diagnostics.push({
    level: 'info',
    message: `mapping 视图「${view.id}」已投影: ${tables.length} 映射表, ${closures.length} 封口, ${chains.length} 同位链, ${expansions.length} 域展开`,
  });
  return { viewProjection, endpointProjection };
}

// ---------- form/summary 视图(原逻辑,抽出方便扩展派生字段) ----------

function projectFormOrSummaryView({ ir, view, diagnostics }: ProjectViewArgs): ProjectViewResult | null {
  const concept = ir.concepts.find(c => c.name === view.primaryConcept);
  if (!concept) {
    diagnostics.push({
      level: 'error',
      message: `视图「${view.id}」声明的主概念「${view.primaryConcept}」未在 .csl 中定义`,
    });
    return null;
  }

  const formFields = conceptToFormFields(concept, ir.attributes);
  const fieldNames = new Set(formFields.map(f => f.name));

  // 仅取作用于该概念的不变量与规则(根据字段引用 + 范围谓词判断)
  const conceptInvariants = ir.invariants.filter(inv => invariantAppliesToConcept(inv, fieldNames));
  const conceptRules = ir.rules.filter(r => ruleAppliesToConcept(r, concept.name, fieldNames));

  const invariantChecks = invariantsToChecks(conceptInvariants, fieldNames);
  const ruleEvaluations = conceptRules.map(r => ruleToEvaluation(r, fieldNames));

  const componentName = toComponentName(view.id);
  const handlerName = toHandlerName(view.id);

  const inputSchema: Record<string, 'string' | 'number'> = {};
  if (view.mode !== 'summary') {
    for (const a of ir.attributes.filter(a => a.owner_id === concept.id)) {
      inputSchema[a.name] = attrTypeToBackendType(a.value_type);
    }
  }

  // Phase 2.3:为 form 视图自动派生函数字段
  // 规则:函数的所有参数名都能在 form 字段集合中找到 → 作为派生字段绑定
  const derivedFields: DerivedFieldSpec[] = [];
  if (view.mode !== 'summary') {
    for (const fn of ir.functions) {
      if (fn.params.length === 0) continue;
      const allParamsResolved = fn.params.every(p => fieldNames.has(p));
      if (allParamsResolved) {
        derivedFields.push({
          label: fn.name,
          functionName: fn.name,
          argFields: fn.params,
        });
      }
    }
    if (derivedFields.length > 0) {
      diagnostics.push({
        level: 'info',
        message: `视图「${view.id}」自动绑定 ${derivedFields.length} 个函数派生字段: ${derivedFields.map(d => d.label).join(', ')}`,
      });
    }
  }

  const viewProjection: ViewProjection = {
    id: view.id,
    path: view.path,
    mode: view.mode || (view.method === 'GET' ? 'summary' : 'form'),
    componentName,
    pageTitle: view.title,
    primaryConcept: view.primaryConcept,
    subjectRef: view.subjectRef,
    formFields: view.mode === 'summary' ? [] : formFields,
    endpoint: view.endpoint,
    method: view.method || 'POST',
    derivedFields: derivedFields.length > 0 ? derivedFields : undefined,
  };

  const isSubjectSummary = (view.mode === 'summary') && !!view.subjectRef;
  const endpointProjection: EndpointProjection = {
    handlerName,
    endpoint: view.endpoint,
    method: view.method || 'POST',
    viewId: view.id,
    primaryConcept: view.primaryConcept,
    inputSchema,
    invariantChecks,
    ruleEvaluations,
    ...(isSubjectSummary ? { stageKind: 'summary' as const, subjectRef: view.subjectRef } : {}),
  };

  return { viewProjection, endpointProjection };
}

// ---------- 主入口 ----------

export interface BuildProjectionInput {
  ir: IRContainer;
  manifest: AppManifest;
  primaryConcept?: string;  // 兼容旧 API,Phase 2.0 优先用 manifest.views
}

export interface BuildProjectionOutput {
  frontend: FrontendProjection;
  backend: BackendProjection;
  diagnostics: ProjectionDiagnostic[];
}

/**
 * 构造投影:
 *   - 若 manifest.views 非空 → 多视图模式,逐 view 投影
 *   - 否则 → Phase 1 回退:取首个非「应用」概念,合成单 ViewDecl
 */
export function buildProjections({ ir, manifest, primaryConcept }: BuildProjectionInput): BuildProjectionOutput {
  const diagnostics: ProjectionDiagnostic[] = [];
  let viewDecls = manifest.views ? [...manifest.views] : [];

  // ---- 回退:无视图声明 → 单视图(Phase 1 行为) ----
  if (viewDecls.length === 0) {
    const candidates = ir.concepts.filter(c => c.name !== '应用' && c.name !== '视图');
    const concept = primaryConcept
      ? candidates.find(c => c.name === primaryConcept) || candidates[0]
      : candidates[0];
    if (!concept) {
      diagnostics.push({ level: 'error', message: '未找到可投影的业务概念(除「应用」「视图」之外)' });
      return { frontend: emptyFrontend(manifest), backend: emptyBackend(manifest), diagnostics };
    }
    viewDecls = [{
      id: 'main',
      title: manifest.entryView || manifest.name,
      path: '/',
      primaryConcept: concept.name,
      endpoint: toEndpointSlug(concept.name),
      method: 'POST',
      mode: 'form',
    }];
    diagnostics.push({
      level: 'info',
      message: `未声明视图,自动构造主视图: 主概念=${concept.name}, 路径=/, 端点=${viewDecls[0].endpoint}`,
    });
  }

  // ---- 逐视图投影 ----
  const viewProjections: ViewProjection[] = [];
  const endpointProjections: EndpointProjection[] = [];
  for (const view of viewDecls) {
    const r = projectOneView({ ir, view, diagnostics });
    if (r) {
      viewProjections.push(r.viewProjection);
      endpointProjections.push(r.endpointProjection);
    }
  }

  if (viewProjections.length === 0) {
    diagnostics.push({ level: 'error', message: '所有视图投影均失败' });
    return { frontend: emptyFrontend(manifest), backend: emptyBackend(manifest), diagnostics };
  }

  // ---- 路由表 ----
  const routes: RouteEntry[] = viewProjections.map(v => ({
    path: v.path, componentName: v.componentName, viewId: v.id,
  }));

  // ---- 主视图(用于 Phase 1 兼容字段) ----
  const entry = viewProjections.find(v => v.id === manifest.entryView) || viewProjections[0];
  const entryEndpoint = endpointProjections.find(e => e.viewId === entry.id) || endpointProjections[0];

  const frontend: FrontendProjection = {
    appComponentName: toAppComponentName(manifest.name),
    views: viewProjections,
    routes,
    // 兼容字段
    componentName: entry.componentName,
    pageTitle: entry.pageTitle,
    primaryConcept: entry.primaryConcept,
    formFields: entry.formFields,
    submitEndpoint: entry.endpoint,
    ruleResultLabels: entryEndpoint.ruleEvaluations.map(r => r.name),
    invariantResultLabels: entryEndpoint.invariantChecks.map(i => i.name),
  };

  const backend: BackendProjection = {
    endpoints: endpointProjections,
    // 兼容字段
    handlerName: entryEndpoint.handlerName,
    endpoint: entryEndpoint.endpoint,
    inputSchema: entryEndpoint.inputSchema,
    invariantChecks: entryEndpoint.invariantChecks,
    ruleEvaluations: entryEndpoint.ruleEvaluations,
  };

  diagnostics.push({
    level: 'info',
    message: `投影完成: ${viewProjections.length} 视图 / ${endpointProjections.length} endpoint / 入口=${entry.id}`,
  });

  return { frontend, backend, diagnostics };
}

function emptyFrontend(manifest: AppManifest): FrontendProjection {
  return {
    appComponentName: toAppComponentName(manifest.name),
    views: [], routes: [],
    componentName: toComponentName(manifest.name),
    pageTitle: manifest.entryView,
    primaryConcept: '',
    formFields: [],
    submitEndpoint: '/api/empty',
    ruleResultLabels: [],
    invariantResultLabels: [],
  };
}

function emptyBackend(manifest: AppManifest): BackendProjection {
  return {
    endpoints: [],
    handlerName: 'handleEmpty',
    endpoint: '/api/empty',
    inputSchema: {},
    invariantChecks: [],
    ruleEvaluations: [],
  };
}
