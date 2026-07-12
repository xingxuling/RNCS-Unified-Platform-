import type {
  IRContainer, ValidateResult, SelectResult, InferResult, TraceResult,
  ClauseSpec, FunctionCallResult, FunctionSpec, IfClause, ActionSpec,
  RuleEvidenceLink,
} from './types';
import { enforce, guard, type OSEVerdict } from './runtime/guard';
import type { CapabilityProfile } from './capability/profile';

// H1:五入口硬守卫 — profile 必传。任何调用方忘传都会在 TS 编译期报错,
//        消除"不传 profile 即穿透"的后门。
// H2:callCSLFunction 接收 oseVerdict;OSE block 时 RuntimeGuard 直接拒绝执行。

// --- Helpers ---

function getConceptChain(ir: IRContainer, conceptId: string): string[] {
  const chain: string[] = [];
  let current = conceptId;
  while (current) {
    chain.push(current);
    const concept = ir.concepts.find(c => c.id === current);
    current = concept?.parent_id || '';
  }
  return chain;
}

function getInvariantsForConcept(ir: IRContainer, conceptId: string) {
  const chain = getConceptChain(ir, conceptId);
  return ir.invariants.filter(inv => chain.includes(inv.scope_id));
}

function getAttributesForConcept(ir: IRContainer, conceptId: string) {
  const chain = getConceptChain(ir, conceptId);
  return ir.attributes.filter(attr => chain.includes(attr.owner_id));
}

/**
 * 表达式求值：支持
 *  - 字面量：数字、字符串
 *  - 标识符：从 values 取值
 *  - 算术：+ - * /
 *  - 括号
 * 输入可以是 number / string（含表达式）/ 其他
 */
function evalExpr(raw: unknown, values: Record<string, unknown>): unknown {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return raw;

  const s = raw.trim();
  // 纯字符串字面量保留
  if (!/[+\-*/()]/.test(s)) {
    // 尝试解析为数字
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    // 标识符引用
    if (values[s] !== undefined) return values[s];
    return raw;
  }

  // 简易 tokenizer + 递归下降
  const tokens = s.match(/[+\-*/()]|\d+(\.\d+)?|[\u4e00-\u9fff\w]+/g) || [];
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = () => tokens[pos++];

  const parsePrimary = (): number => {
    const t = eat();
    if (t === '(') {
      const v = parseExpr();
      eat(); // )
      return v;
    }
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    // 标识符
    const v = values[t];
    return typeof v === 'number' ? v : Number(v) || 0;
  };
  const parseTerm = (): number => {
    let left = parsePrimary();
    while (peek() === '*' || peek() === '/') {
      const op = eat();
      const right = parsePrimary();
      left = op === '*' ? left * right : left / right;
    }
    return left;
  };
  const parseExpr = (): number => {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = eat();
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };

  try { return parseExpr(); } catch { return raw; }
}

function evaluateClause(clause: ClauseSpec, values: Record<string, unknown>): boolean {
  if (clause.left === '_always') return true;

  const leftParts = clause.left.split('.');
  const fieldName = leftParts[leftParts.length - 1];
  const leftVal = values[fieldName];

  if (leftVal === undefined) return true;

  // 右值可能是表达式
  const rightVal = evalExpr(clause.right, values);

  switch (clause.op) {
    case 'eq': return leftVal === rightVal;
    case 'neq': return leftVal !== rightVal;
    case 'gt': return Number(leftVal) > Number(rightVal);
    case 'lt': return Number(leftVal) < Number(rightVal);
    case 'gte': return Number(leftVal) >= Number(rightVal);
    case 'lte': return Number(leftVal) <= Number(rightVal);
    case 'in': return Array.isArray(rightVal) && (rightVal as unknown[]).includes(leftVal);
    default: return true;
  }
}

// --- validate ---

export function validate(ir: IRContainer, profile: CapabilityProfile): ValidateResult {
  // H1: profile 必传 → 硬守卫始终生效,不再有 "忘传即放行" 后门
  const g = guard('validate', { profile, ir });
  if (!g.allowed) {
    return { valid: false, errors: [g.reason || 'validate 被 RuntimeGuard 拦截'], warnings: [] };
  }
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const entity of ir.entities) {
    const concept = ir.concepts.find(c => c.id === entity.concept_id);
    if (!concept) {
      errors.push(`实例 ${entity.name} 引用了不存在的概念 ${entity.concept_id}`);
      continue;
    }

    const attrs = getAttributesForConcept(ir, entity.concept_id);
    for (const attr of attrs) {
      const val = entity.values[attr.name];
      if (val === undefined) {
        warnings.push(`实例 ${entity.name} 缺少属性 ${attr.name}`);
        continue;
      }
      if (attr.value_type === '数值' && typeof val !== 'number') {
        errors.push(`实例 ${entity.name} 的属性 ${attr.name} 应为数值，但得到 "${val}"`);
      }
      if (attr.value_type === '文本' && typeof val !== 'string') {
        errors.push(`实例 ${entity.name} 的属性 ${attr.name} 应为文本，但得到 "${val}"`);
      }
      if (attr.value_type === '枚举' && attr.enum_values.length > 0) {
        if (!attr.enum_values.includes(String(val))) {
          errors.push(`实例 ${entity.name} 的属性 ${attr.name} 值 "${val}" 不在枚举 [${attr.enum_values.join(', ')}] 中`);
        }
      }
    }

    const invariants = getInvariantsForConcept(ir, entity.concept_id);
    for (const inv of invariants) {
      for (const clause of inv.clauses) {
        if (!evaluateClause(clause, entity.values)) {
          errors.push(`实例 ${entity.name} 违反不变量：${clause.left} ${clause.op} ${clause.right}`);
        }
      }
    }
  }

  // Validate function references
  for (const rule of ir.rules) {
    for (const action of rule.actions) {
      if (action.action_type === 'call' && action.payload.call) {
        const callPayload = action.payload.call as { name: string };
        if (!ir.functions.some(f => f.name === callPayload.name)) {
          warnings.push(`规则 ${rule.name} 调用了未定义的函数 "${callPayload.name}"`);
        }
      }
    }
    for (const cond of rule.conditions) {
      const parts = cond.left.split('.');
      if (parts.length > 1) {
        const ref = parts[0];
        const found = ir.concepts.some(c => c.name === ref) ||
                      ir.entities.some(e => e.name === ref);
        if (!found && ref !== '候选') {
          warnings.push(`规则 ${rule.name} 引用了未定义的对象 "${ref}"`);
        }
      }
    }
  }

  // Validate templates expanded correctly
  for (const template of ir.templates) {
    if (template.type_params.length === 0) {
      warnings.push(`模板 ${template.name} 没有类型参数`);
    }
  }

  // 0.3：高阶语义校验
  const stageNames = new Set(ir.stages.map(s => s.name));
  for (const sub of ir.subjects) {
    if (sub.current_stage && !stageNames.has(sub.current_stage)) {
      warnings.push(`主体 ${sub.name} 的当前阶段 "${sub.current_stage}" 未定义`);
    }
  }
  for (const tr of ir.transitions) {
    if (tr.from_stage && !stageNames.has(tr.from_stage)) {
      warnings.push(`阶段转移 ${tr.name} 的起始阶段 "${tr.from_stage}" 未定义`);
    }
    if (tr.to_stage && !stageNames.has(tr.to_stage)) {
      warnings.push(`阶段转移 ${tr.name} 的目标阶段 "${tr.to_stage}" 未定义`);
    }
  }
  const subjectNames = new Set(ir.subjects.map(s => s.name));
  for (const r of ir.regenerations) {
    if (r.subject_ref && !subjectNames.has(r.subject_ref)) {
      warnings.push(`再生事件 ${r.name} 引用了未定义的主体 "${r.subject_ref}"`);
    }
  }

  // 0.4：东方本体论原语校验
  for (const mt of ir.mapping_tables) {
    if (!mt.aligned) {
      errors.push(
        `映射表 ${mt.name}：${mt.misaligned_rows.length} 行未对齐（应为 ${mt.columns.length} 列），错位行：${mt.misaligned_rows.join('、')}`
      );
    }
  }
  for (const cl of ir.closures) {
    if (!cl.closed) {
      const diff = cl.total - cl.computed_sum;
      errors.push(
        `封口 ${cl.name}：声明总数 ${cl.total}，实际加和 ${cl.computed_sum}，差额 ${diff > 0 ? '+' : ''}${diff}`
      );
    }
  }
  for (const ch of ir.correspondence_chains) {
    if (!ch.aligned) {
      errors.push(
        `同位链 ${ch.name}：项数 ${ch.items.length} 与域数 ${ch.domains.length} 不一致`
      );
    }
  }
  for (const de of ir.domain_expansions) {
    const expected = de.mother_law_values.length;
    for (const f of de.factors) {
      if (f.items.length !== expected) {
        warnings.push(
          `域展开 ${de.name}：域「${f.domain}」的因数 ${f.items.length} ≠ 母法值数 ${expected}`
        );
      }
      if (!de.domains.includes(f.domain)) {
        warnings.push(`域展开 ${de.name}：定义了「${f.domain}」的五因，但该域未在域列表中声明`);
      }
    }
    const declaredDomains = new Set(de.factors.map(f => f.domain));
    for (const d of de.domains) {
      if (!declaredDomains.has(d)) {
        warnings.push(`域展开 ${de.name}：域「${d}」缺少五因定义`);
      }
    }
  }

  // 0.5：主权判断 OS 校验
  for (const est of ir.establishments) {
    for (const layer of est.layers) {
      if (!layer.matched) {
        errors.push(
          `编制 ${est.name}：层级「${layer.label}」声明 ${layer.declared} 个，实际 ${layer.actual} 个（差额 ${layer.actual - layer.declared > 0 ? '+' : ''}${layer.actual - layer.declared}）`
        );
      }
    }
    if (est.declared_total !== null && !est.total_matched) {
      errors.push(
        `编制 ${est.name}：总计声明 ${est.declared_total}，实际单元数 ${est.actual_total}`
      );
    }
  }
  for (const prof of ir.profiles) {
    if (prof.lower > prof.upper) {
      errors.push(`档位 ${prof.name}：下限 ${prof.lower} 大于上限 ${prof.upper}`);
    }
    if (prof.upper > ir.units.length && ir.units.length > 0) {
      warnings.push(`档位 ${prof.name}：上限 ${prof.upper} 超过总单元数 ${ir.units.length}`);
    }
  }
  for (const tr of ir.tradeoffs) {
    if (tr.red_units.length > 0) {
      warnings.push(
        `权衡 ${tr.name}：${tr.red_units.length} 个单元处于「低价值高代价」象限：${tr.red_units.join('、')}`
      );
    }
  }
  // 单元层级一致性
  const validLayers = new Set(['母体', '显性', '隐性', '微观']);
  for (const u of ir.units) {
    if (u.layer && !validLayers.has(u.layer)) {
      warnings.push(`单元 ${u.name}：层级「${u.layer}」不在标准集合（母体/显性/隐性/微观）中`);
    }
  }

  // 0.6：数字文明母体引擎校验
  const engineNames = new Set(ir.engines.map(e => e.name));
  for (const m of ir.engine_modules) {
    if (m.engine_ref && !engineNames.has(m.engine_ref)) {
      warnings.push(`模块 ${m.name}：隶属引擎「${m.engine_ref}」未定义`);
    }
  }
  for (const a of ir.engine_actions) {
    if (a.engine_ref && !engineNames.has(a.engine_ref)) {
      warnings.push(`动作 ${a.name}：隶属引擎「${a.engine_ref}」未定义`);
    }
  }
  for (const x of ir.engine_axes) {
    if (x.engine_ref && !engineNames.has(x.engine_ref)) {
      warnings.push(`轴 ${x.name}：隶属引擎「${x.engine_ref}」未定义`);
    }
  }
  for (const eng of ir.engines) {
    if (eng.module_count === 0) {
      warnings.push(`引擎 ${eng.name}：未声明任何模块`);
    }
    if (eng.action_count === 0) {
      warnings.push(`引擎 ${eng.name}：未声明任何动作`);
    }
    if (eng.kind === 'unknown') {
      warnings.push(`引擎 ${eng.name}：类型未识别（应为 主体/记忆/版本/不变量/动态变量/逻辑链）`);
    }
  }
  // 不变量引擎应覆盖 5 域
  const expectedDomains = ['宇宙', '生灵', '家庭', '社会', '人文'];
  for (const eng of ir.engines.filter(e => e.kind === 'invariant')) {
    const axisNames = ir.engine_axes.filter(x => x.engine_ref === eng.name).map(x => x.name);
    const missing = expectedDomains.filter(d => !axisNames.some(n => n.includes(d)));
    if (missing.length > 0 && axisNames.length > 0) {
      warnings.push(`不变量引擎 ${eng.name}：建议覆盖 5 域，缺少「${missing.join('、')}」`);
    }
  }
  // 同一引擎内模块/动作/轴序号唯一
  for (const eng of ir.engines) {
    const axes = ir.engine_axes.filter(x => x.engine_ref === eng.name);
    const seen = new Set<number>();
    for (const x of axes) {
      if (x.index > 0 && seen.has(x.index)) {
        warnings.push(`引擎 ${eng.name}：轴序号 ${x.index} 重复（${x.name}）`);
      }
      seen.add(x.index);
    }
  }

  // 0.7：概念块/命题块/关系块校验
  const cblkNames = new Set(ir.concept_blocks.map(c => c.name));
  // 名称重复
  const seenCblk = new Set<string>();
  for (const c of ir.concept_blocks) {
    if (seenCblk.has(c.name)) errors.push(`概念块 ${c.name}：名称重复`);
    seenCblk.add(c.name);
    if (!c.definition) warnings.push(`概念块 ${c.name}：缺少「定义」字段`);
    if (c.confidence < 0 || c.confidence > 1) {
      warnings.push(`概念块 ${c.name}：置信度 ${c.confidence} 应在 [0,1] 区间`);
    }
    // 相邻概念应都已声明
    for (const n of c.neighbors) {
      if (!cblkNames.has(n)) {
        warnings.push(`概念块 ${c.name}：相邻概念「${n}」未声明`);
      }
    }
  }
  for (const p of ir.proposition_blocks) {
    if (!p.resolved) {
      warnings.push(`命题块 ${p.name}：引用了未声明的概念块「${p.missing_refs.join('、')}」`);
    }
    if (!p.predicate) warnings.push(`命题块 ${p.name}：缺少「谓语」`);
    if (p.confidence < 0 || p.confidence > 1) {
      warnings.push(`命题块 ${p.name}：置信度应在 [0,1]`);
    }
  }
  for (const r of ir.relation_blocks) {
    if (!r.resolved) {
      warnings.push(`关系块 ${r.name}：源/靶 未声明：「${r.missing_refs.join('、')}」`);
    }
  }

  // 0.7+ — 概念块到母体引擎的挂载校验
  if (ir.engines.length > 0) {
    for (const c of ir.concept_blocks) {
      if (!c.matrix_engine) {
        warnings.push(`概念块 ${c.name}：未挂载到任何「母体」引擎，建议补充 母体 = 引擎名`);
      } else if (!c.matrix_resolved) {
        warnings.push(`概念块 ${c.name}：母体引擎「${c.matrix_engine}」未声明`);
      }
    }
  }
  // 命题块/关系块的 主语/宾语/源/靶 也允许指向已声明实体（避免误报）
  const entityNames = new Set(ir.entities.map(e => e.name));
  for (const p of ir.proposition_blocks) {
    if (!p.resolved) {
      // 若缺失引用其实在 entities 中，则降级为 info 文案（不再额外报）
      const stillMissing = p.missing_refs.filter(r => !entityNames.has(r));
      if (stillMissing.length === 0) {
        // 全部能在实体表找到，移除该警告（之前已 push，这里清理）
        const idx = warnings.findIndex(w => w.includes(`命题块 ${p.name}：引用了未声明的概念块`));
        if (idx >= 0) warnings.splice(idx, 1);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function select(ir: IRContainer, conceptName: string | undefined, profile: CapabilityProfile): SelectResult {
  // H1: profile 必传
  const g = guard('select', { profile, ir });
  if (!g.allowed) {
    return { result: [], excluded: [], reasons: { _guard: [g.reason || 'select 被 RuntimeGuard 拦截'] } };
  }
  const result: string[] = [];
  const excluded: string[] = [];
  const reasons: Record<string, string[]> = {};

  const targetConcepts = conceptName
    ? ir.concepts.filter(c => c.name === conceptName)
    : ir.concepts;
  
  const targetConceptIds = new Set<string>();
  for (const tc of targetConcepts) {
    targetConceptIds.add(tc.id);
    for (const c of ir.concepts) {
      if (getConceptChain(ir, c.id).includes(tc.id)) {
        targetConceptIds.add(c.id);
      }
    }
  }

  for (const entity of ir.entities) {
    if (conceptName && !targetConceptIds.has(entity.concept_id)) continue;

    const invariants = getInvariantsForConcept(ir, entity.concept_id);
    const failures: string[] = [];

    for (const inv of invariants) {
      for (const clause of inv.clauses) {
        if (!evaluateClause(clause, entity.values)) {
          failures.push(`${clause.left} ${clause.op} ${clause.right}`);
        }
      }
    }

    if (failures.length === 0) {
      result.push(entity.name);
    } else {
      excluded.push(entity.name);
      reasons[entity.name] = failures;
    }
  }

  return { result, excluded, reasons };
}

// --- infer ---

export function infer(ir: IRContainer, profile: CapabilityProfile): InferResult {
  // H1: profile 必传
  const g = guard('infer', { profile, ir });
  if (!g.allowed) {
    return { returns: [], labels: {}, excluded: [], evidence_chains: {} };
  }
  const returns: string[] = [];
  const labels: Record<string, string[]> = {};
  const excludedSet = new Set<string>();
  const evidence_chains: Record<string, RuleEvidenceLink[]> = {};

  for (const rule of ir.rules) {
    for (const entity of ir.entities) {
      let allMatch = true;
      const matchedConditions: string[] = [];
      for (const cond of rule.conditions) {
        const parts = cond.left.split('.');
        let fieldName: string;
        
        if (parts.length > 1 && parts[0] === '候选') {
          fieldName = parts.slice(1).join('.');
        } else {
          fieldName = parts[parts.length - 1];
        }

        if (cond.op === 'in') {
          const conceptName = String(cond.right);
          const concept = ir.concepts.find(c => c.name === conceptName);
          if (concept) {
            const chain = getConceptChain(ir, entity.concept_id);
            if (!chain.includes(concept.id)) {
              allMatch = false;
              break;
            }
          }
          matchedConditions.push(`${cond.left} ∈ ${conceptName}`);
          continue;
        }

        const testValues = { [fieldName]: entity.values[fieldName] };
        if (!evaluateClause({ ...cond, left: fieldName }, testValues)) {
          allMatch = false;
          break;
        }
        matchedConditions.push(`${cond.left} ${cond.op} ${String(cond.right)}`);
      }

      if (!allMatch) continue;

      // 0.8 — 收集证据链：找指向该实体的 evidences、命题块、关系块
      const evidenceRefs = new Set<string>();
      for (const ev of ir.evidences) {
        if (ev.supports.includes(entity.name)) evidenceRefs.add(`证据·${ev.name}`);
      }
      for (const p of ir.proposition_blocks) {
        if (p.subject === entity.name || p.object === entity.name) {
          evidenceRefs.add(`命题块·${p.name}`);
        }
      }
      for (const r of ir.relation_blocks) {
        if (r.source === entity.name || r.target === entity.name) {
          evidenceRefs.add(`关系块·${r.name}`);
        }
      }

      const actionSummaries: string[] = [];
      for (const action of rule.actions) {
        if (action.action_type === 'mark') actionSummaries.push(`标记为「${String(action.payload.label)}」`);
        else if (action.action_type === 'return') actionSummaries.push(`返回 ${String(action.payload.value)}`);
        else if (action.action_type === 'exclude') actionSummaries.push('排除');
        else actionSummaries.push(action.action_type);
        applyAction(action, entity.name, returns, labels, excludedSet, ir, entity.values);
      }

      if (!evidence_chains[entity.name]) evidence_chains[entity.name] = [];
      evidence_chains[entity.name].push({
        rule_name: rule.name,
        matched_conditions: matchedConditions,
        evidence_refs: [...evidenceRefs],
        action_summary: actionSummaries.join(' / '),
      });
    }
  }

  return { returns, labels, excluded: Array.from(excludedSet), evidence_chains };
}

function applyAction(
  action: ActionSpec,
  entityName: string,
  returns: string[],
  labels: Record<string, string[]>,
  excludedSet: Set<string>,
  ir: IRContainer,
  values: Record<string, unknown>,
) {
  switch (action.action_type) {
    case 'return':
      returns.push(entityName);
      break;
    case 'mark':
      if (!labels[entityName]) labels[entityName] = [];
      labels[entityName].push(String(action.payload.label));
      break;
    case 'exclude':
      excludedSet.add(entityName);
      break;
    case 'call':
      if (action.payload.call) {
        const callInfo = action.payload.call as { name: string; args: string[] };
        const result = callFunction(ir, callInfo.name, callInfo.args, values);
        if (result) {
          for (const a of result.executedActions) {
            applyAction(a, entityName, returns, labels, excludedSet, ir, values);
          }
        }
      }
      if (action.payload.if_expr) {
        // Inline if expression in rule
        const ifExpr = action.payload.if_expr as {
          type: 'IfExpr';
          condition: { left: string; op: string; right: unknown };
          then_branch: Array<{ type: string; action_type?: string; payload?: Record<string, unknown> }>;
          else_branch: Array<{ type: string; action_type?: string; payload?: Record<string, unknown> }>;
          else_if_branches: Array<{
            condition: { left: string; op: string; right: unknown };
            body: Array<{ type: string; action_type?: string; payload?: Record<string, unknown> }>;
          }>;
        };
        const clause: ClauseSpec = {
          left: ifExpr.condition.left,
          op: ifExpr.condition.op,
          right: ifExpr.condition.right,
        };
        if (evaluateClause(clause, values)) {
          for (const a of ifExpr.then_branch) {
            if (a.action_type && a.payload) {
              applyAction({ action_type: a.action_type, payload: a.payload }, entityName, returns, labels, excludedSet, ir, values);
            }
          }
        } else {
          let handled = false;
          for (const elif of ifExpr.else_if_branches || []) {
            const elifClause: ClauseSpec = {
              left: elif.condition.left,
              op: elif.condition.op,
              right: elif.condition.right,
            };
            if (evaluateClause(elifClause, values)) {
              for (const a of elif.body) {
                if (a.action_type && a.payload) {
                  applyAction({ action_type: a.action_type, payload: a.payload }, entityName, returns, labels, excludedSet, ir, values);
                }
              }
              handled = true;
              break;
            }
          }
          if (!handled) {
            for (const a of ifExpr.else_branch || []) {
              if (a.action_type && a.payload) {
                applyAction({ action_type: a.action_type, payload: a.payload }, entityName, returns, labels, excludedSet, ir, values);
              }
            }
          }
        }
      }
      break;
  }
}

// --- Function execution ---

interface FunctionExecResult {
  returnValue: unknown;
  executedActions: ActionSpec[];
  trace: string[];
}

function callFunction(
  ir: IRContainer,
  funcName: string,
  args: string[],
  contextValues: Record<string, unknown>,
): FunctionExecResult | null {
  const func = ir.functions.find(f => f.name === funcName);
  if (!func) return null;

  // Build param → value mapping
  const paramValues: Record<string, unknown> = { ...contextValues };
  for (let i = 0; i < func.params.length; i++) {
    paramValues[func.params[i]] = args[i] || null;
  }

  const executedActions: ActionSpec[] = [];
  const trace: string[] = [`调用函数 ${funcName}(${args.join(', ')})`];
  let returnValue: unknown = null;

  for (const item of func.body) {
    if ('condition' in item) {
      // IfClause
      const ifClause = item as IfClause;
      if (evaluateClause(ifClause.condition, paramValues)) {
        trace.push(`条件匹配: ${ifClause.condition.left} ${ifClause.condition.op} ${ifClause.condition.right}`);
        for (const action of ifClause.actions) {
          if (action.action_type === 'return') {
            returnValue = action.payload.value;
            trace.push(`返回: ${returnValue}`);
            return { returnValue, executedActions, trace };
          }
          executedActions.push(action);
        }
      }
    } else {
      // Direct ActionSpec
      const action = item as ActionSpec;
      if (action.action_type === 'return') {
        returnValue = action.payload.value;
        trace.push(`返回: ${returnValue}`);
        return { returnValue, executedActions, trace };
      }
      executedActions.push(action);
    }
  }

  return { returnValue, executedActions, trace };
}

// --- Public function call interface ---

/**
 * 对外函数调用入口。
 * H1: profile 必传(从软守卫升级为硬守卫)
 * H2: oseVerdict 必传 — OSE block 时 RuntimeGuard 直接抛 RuntimeGuardError,
 *      runtime 拒绝执行函数;调用方需在 try/catch 中处理。
 *      允许传 { blocked: false, reasons: [] } 的"放行裁决"。
 */
export function callCSLFunction(
  ir: IRContainer,
  funcName: string,
  args: Record<string, unknown>,
  profile: CapabilityProfile,
  oseVerdict: OSEVerdict,
): FunctionCallResult {
  const fnNode = ir.functions.find(f => f.name === funcName);
  // H2: enforce 内部消费 oseVerdict.blocked;blocked → 抛 RuntimeGuardError
  enforce('callFunction', {
    profile, ir, target: funcName,
    irNode: fnNode as unknown as import('./types').IRNodeGovernance | undefined,
    oseVerdict,
  });

  const func = ir.functions.find(f => f.name === funcName);
  if (!func) {
    return { function_name: funcName, args, result: null, trace: [`函数 ${funcName} 未定义`] };
  }

  const argValues = func.params.map(p => String(args[p] ?? ''));
  const execResult = callFunction(ir, funcName, argValues, args);

  return {
    function_name: funcName,
    args,
    result: execResult?.returnValue ?? null,
    trace: execResult?.trace ?? [],
  };
}

// --- trace ---

export function trace(ir: IRContainer, target: string, profile: CapabilityProfile): TraceResult {
  // H1: profile 必传
  const g = guard('trace', { profile, ir });
  if (!g.allowed) {
    return { target, evidence_chain: [] };
  }
  const chain: TraceResult['evidence_chain'] = [];
  const parts = target.split('.');
  const entityName = parts[0];

  for (const ev of ir.evidences) {
    const relevant = ev.supports.some(s =>
      s === entityName ||
      s.startsWith(entityName + '.') ||
      s === target
    );
    if (relevant) {
      chain.push({
        source: ev.source,
        snippet: ev.snippet,
        supports: ev.supports,
      });
    }
  }

  const entity = ir.entities.find(e => e.name === entityName);
  if (entity) {
    for (const evId of entity.evidence_ids) {
      const ev = ir.evidences.find(e => e.id === evId);
      if (ev && !chain.some(c => c.source === ev.source)) {
        chain.push({
          source: ev.source,
          snippet: ev.snippet,
          supports: ev.supports,
        });
      }
    }
  }

  return { target, evidence_chain: chain };
}
