// CSL 全栈投影 ↔ OSE 治理桥
// Phase 1.5 最小接入: 4 个原始 hook(问题定义/一致性/风险/假设)
// Phase 2.0 扩展: 路由一致性 / 多概念覆盖 / 死路检测
// Phase 2.1 扩展: 阶段合法性 / 转移完整性 / 信号有效性 / 再生孤立
// 所有 Phase 2.1 新增项均为 warn 级,不阻塞投影

import type { IRContainer } from '../types';
import type {
  AppManifest, FrontendProjection, BackendProjection, ProjectionDiagnostic,
} from './types';

export interface OSEReport {
  problemDefinition: ProjectionDiagnostic[];
  structuralConsistency: ProjectionDiagnostic[];
  risks: ProjectionDiagnostic[];
  assumptions: ProjectionDiagnostic[];
  // Phase 2.0
  routeConsistency?: ProjectionDiagnostic[];
  multiConceptCoverage?: ProjectionDiagnostic[];
  deadRouteDetection?: ProjectionDiagnostic[];
  // Phase 2.1
  stageLegality?: ProjectionDiagnostic[];
  transitionCompleteness?: ProjectionDiagnostic[];
  signalValidity?: ProjectionDiagnostic[];
  regenerationIsolation?: ProjectionDiagnostic[];
  // Phase 2.3
  functionRisk?: ProjectionDiagnostic[];
  blockIntegrity?: ProjectionDiagnostic[];
  boundaryIntegrity?: ProjectionDiagnostic[];
  // Phase 2.5:裁决层升级,新增两个 hook
  stageReachability?: ProjectionDiagnostic[];
  mappingCoverage?: ProjectionDiagnostic[];
}

export const OSE_HOOK_IDS = [
  'problemDefinition',
  'structuralConsistency',
  'risks',
  'assumptions',
  'routeConsistency',
  'multiConceptCoverage',
  'deadRouteDetection',
  'stageLegality',
  'transitionCompleteness',
  'signalValidity',
  'regenerationIsolation',
  'functionRisk',
  'blockIntegrity',
  'boundaryIntegrity',
  'stageReachability',
  'mappingCoverage',
] as const;

export type OSEHookId = typeof OSE_HOOK_IDS[number];

export interface OSEInput {
  ir: IRContainer;
  manifest: AppManifest | null;
  frontend: FrontendProjection | null;
  backend: BackendProjection | null;
}

// ---------- Hook 1: 问题定义 ----------
function checkProblemDefinition(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  if (!i.manifest) {
    out.push({ level: 'error', message: '[OSE/问题定义] 缺失 AppManifest,投影目标未成立' });
    return out;
  }
  // 视图模式分流:blocks/mapping/stage 不强依赖 primaryConcept,各自有专属锚点
  const views = i.frontend?.views || [];
  const allBlocksOrMapping = views.length > 0 && views.every(v => v.mode === 'blocks' || v.mode === 'mapping');
  const allStageOrBlocksOrMapping = views.length > 0 && views.every(v => v.mode === 'stage' || v.mode === 'blocks' || v.mode === 'mapping');
  const needsPrimaryConcept = views.some(v => v.mode === 'form' || v.mode === 'summary' || !v.mode);

  if (needsPrimaryConcept && !i.frontend?.primaryConcept) {
    out.push({ level: 'error', message: '[OSE/问题定义] 未识别到主概念,投影输入定义不完整' });
  }
  // form 字段为空仅在 form/summary 视图存在时报警
  if (!allStageOrBlocksOrMapping && i.frontend && i.frontend.formFields.length === 0) {
    out.push({ level: 'warn', message: '[OSE/问题定义] 主概念无任何属性,前端将退化为空表单' });
  }
  // 不变量/规则缺失仅在 form/summary 视图存在时报警(blocks/mapping/stage 不消费这两类)
  if (!allStageOrBlocksOrMapping && i.backend && i.backend.invariantChecks.length === 0 && i.backend.ruleEvaluations.length === 0) {
    out.push({ level: 'warn', message: '[OSE/问题定义] 无任何不变量与规则,后端 handler 退化为恒真返回' });
  }
  // blocks/mapping 视图改由各自专属诊断负责(在 ir-to-projection 中产出),此处仅给出 info
  if (allBlocksOrMapping) {
    out.push({ level: 'info', message: '[OSE/问题定义] 全部为 blocks/mapping 视图,使用网络/映射专属问题定义检查' });
  }
  return out;
}

// ---------- Hook 2: 结构一致性 ----------
function checkStructuralConsistency(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  if (!i.frontend || !i.backend) return out;
  // stage 视图字段不在 form 字段集合内,跳过结构对齐
  const isStageOnly = i.frontend.views.length > 0 && i.frontend.views.every(v => v.mode === 'stage');
  if (isStageOnly) {
    out.push({ level: 'info', message: '[OSE/一致性] 仅 stage 视图,跳过 form 字段对齐检查' });
    return out;
  }

  const frontFields = new Set(i.frontend.formFields.map(f => f.name));
  const backFields = new Set(Object.keys(i.backend.inputSchema));
  for (const f of frontFields) {
    if (!backFields.has(f)) out.push({ level: 'error', message: `[OSE/一致性] 前端字段「${f}」在后端 inputSchema 中缺失` });
  }
  for (const f of backFields) {
    if (!frontFields.has(f) && !f.startsWith('__')) {
      out.push({ level: 'warn', message: `[OSE/一致性] 后端 inputSchema 含字段「${f}」但前端未渲染` });
    }
  }
  const refRe = /input\[(?:"|')([^"']+)(?:"|')\]/g;
  const checkExpr = (label: string, expr: string) => {
    let m: RegExpExecArray | null;
    while ((m = refRe.exec(expr))) {
      if (!backFields.has(m[1])) out.push({ level: 'warn', message: `[OSE/一致性] ${label} 引用了未声明字段「${m[1]}」` });
    }
  };
  i.backend.invariantChecks.forEach(c => checkExpr(`不变量「${c.name}」`, c.jsExpression));
  i.backend.ruleEvaluations.forEach(r => checkExpr(`规则「${r.name}」`, r.jsCondition));

  if (out.length === 0) out.push({ level: 'info', message: '[OSE/一致性] 前后端字段集合与表达式引用全部对齐' });
  return out;
}

// ---------- Hook 3: 风险 ----------
function raiseRisks(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  out.push({ level: 'warn', message: '[OSE/风险] Phase 2 投影:无真实 server runtime,浏览器内解释执行 handler' });
  if (i.backend && i.backend.ruleEvaluations.some(r => r.jsCondition === 'true')) {
    out.push({ level: 'warn', message: '[OSE/风险] 检测到恒真规则,可能由 v0.8 子集翻译丢失谓词所致' });
  }
  return out;
}

// ---------- Hook 4: 假设 ----------
function surfaceAssumptions(_i: OSEInput): ProjectionDiagnostic[] {
  return [
    { level: 'info', message: '[OSE/假设] 仅支持 web 目标 (react-ts + node-ts)' },
    { level: 'info', message: '[OSE/假设] stage handler 为纯函数式,无服务端持久状态' },
    { level: 'info', message: '[OSE/假设] 投影协议 v2,字段类型仅支持 text / number' },
  ];
}

// ---------- Phase 2.0 hooks ----------

function checkRouteConsistency(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  if (!i.frontend || !i.backend) return out;
  const viewIds = new Set(i.frontend.views.map(v => v.id));
  const epViewIds = new Set(i.backend.endpoints.map(e => e.viewId));
  for (const v of i.frontend.views) {
    if (!epViewIds.has(v.id)) out.push({ level: 'warn', message: `[OSE/路由] 视图「${v.id}」无对应后端 endpoint` });
  }
  for (const e of i.backend.endpoints) {
    if (!viewIds.has(e.viewId)) out.push({ level: 'warn', message: `[OSE/路由] endpoint ${e.endpoint} 无对应前端视图` });
  }
  if (out.length === 0) out.push({ level: 'info', message: `[OSE/路由] ${i.frontend.views.length} 视图 ↔ ${i.backend.endpoints.length} endpoint 对齐` });
  return out;
}

function checkMultiConceptCoverage(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  if (!i.frontend) return out;
  for (const v of i.frontend.views) {
    // blocks/mapping 视图不强依赖 primaryConcept,跳过此检查(由专属投影器产出 rootBlock 诊断)
    if (v.mode === 'blocks' || v.mode === 'mapping') continue;
    if (!v.primaryConcept) {
      out.push({ level: 'warn', message: `[OSE/概念覆盖] 视图「${v.id}」无主概念绑定` });
      continue;
    }
    const found = i.ir.concepts.find(c => c.name === v.primaryConcept);
    if (!found) out.push({ level: 'warn', message: `[OSE/概念覆盖] 视图「${v.id}」绑定的主概念「${v.primaryConcept}」未在 .csl 中声明` });
  }
  return out;
}

function checkDeadRoute(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  if (!i.frontend) return out;
  const paths = new Set(i.frontend.routes.map(r => r.path));
  // 入口视图必须可路由
  if (i.manifest && i.frontend.views.length > 0) {
    const entry = i.frontend.views.find(v => v.id === i.manifest!.entryView) || i.frontend.views[0];
    if (!paths.has(entry.path)) out.push({ level: 'warn', message: `[OSE/死路] 入口视图「${entry.id}」路径 ${entry.path} 未注册到路由表` });
  }
  return out;
}

// ---------- Phase 2.1 hooks: 主体系统治理(全部 warn) ----------

function checkStageLegality(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  const stageNames = new Set(i.ir.stages.map(s => s.name));
  const subjectNames = new Set(i.ir.subjects.map(s => s.name));

  // [Phase 2.2] 1. 主体当前阶段未声明 → error 硬阻塞
  for (const subj of i.ir.subjects) {
    if (subj.current_stage && !stageNames.has(subj.current_stage)) {
      out.push({ level: 'error', message: `[OSE/阶段合法性] 主体「${subj.name}」当前阶段「${subj.current_stage}」未在 主权阶段 中声明 (BLOCK)` });
    }
  }
  // [Phase 2.2] 2. 转移引用了不存在的阶段 → error
  for (const t of i.ir.transitions) {
    if (t.from_stage && !stageNames.has(t.from_stage)) {
      out.push({ level: 'error', message: `[OSE/阶段合法性] 转移「${t.name}」起始阶段「${t.from_stage}」未声明 (BLOCK)` });
    }
    if (t.to_stage && !stageNames.has(t.to_stage)) {
      out.push({ level: 'error', message: `[OSE/阶段合法性] 转移「${t.name}」目标阶段「${t.to_stage}」未声明 (BLOCK)` });
    }
  }
  // [Phase 2.2] 3. stage / summary 视图绑定的主体不存在 → error
  if (i.frontend) {
    for (const v of i.frontend.views) {
      if ((v.mode === 'stage' || v.mode === 'summary') && v.subjectRef && !subjectNames.has(v.subjectRef)) {
        out.push({ level: 'error', message: `[OSE/阶段合法性] 视图「${v.id}」(${v.mode}) 绑定的主体「${v.subjectRef}」未声明 (BLOCK)` });
      }
    }
  }
  // [Phase 2.2] 4. 默认阶段为空且无法推导(stage endpoint 必须有 defaultStage)
  if (i.backend) {
    for (const e of i.backend.endpoints) {
      if (e.stageKind === 'transition' && !e.defaultStage) {
        out.push({ level: 'error', message: `[OSE/阶段合法性] stage endpoint ${e.endpoint} 无法推导默认阶段,转移判定无法启动 (BLOCK)` });
      }
    }
  }

  // 阶段重号检查 (保留 warn)
  const seen = new Map<number, string>();
  for (const s of i.ir.stages) {
    if (s.index == null) continue;
    if (seen.has(s.index)) {
      out.push({ level: 'warn', message: `[OSE/阶段合法性] 阶段「${s.name}」与「${seen.get(s.index)}」共用序号 ${s.index}` });
    } else seen.set(s.index, s.name);
  }
  if (out.length === 0 && i.ir.subjects.length > 0) {
    out.push({ level: 'info', message: `[OSE/阶段合法性] ${i.ir.subjects.length} 主体 / ${i.ir.stages.length} 阶段 全部合法` });
  }
  return out;
}

function checkTransitionCompleteness(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  const stageNames = new Set(i.ir.stages.map(s => s.name));
  for (const t of i.ir.transitions) {
    if (!t.from_stage || !stageNames.has(t.from_stage)) {
      out.push({ level: 'warn', message: `[OSE/转移完整性] 转移「${t.name}」起始阶段「${t.from_stage || '(空)'}」未声明` });
    }
    if (!t.to_stage || !stageNames.has(t.to_stage)) {
      out.push({ level: 'warn', message: `[OSE/转移完整性] 转移「${t.name}」目标阶段「${t.to_stage || '(空)'}」未声明` });
    }
    if (!t.trigger) {
      out.push({ level: 'warn', message: `[OSE/转移完整性] 转移「${t.name}」无触发条件,将无法被信号激活` });
    }
  }
  // 不可达阶段
  if (i.ir.stages.length > 0 && i.ir.transitions.length > 0) {
    const reachable = new Set<string>();
    i.ir.subjects.forEach(s => s.current_stage && reachable.add(s.current_stage));
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of i.ir.transitions) {
        if (reachable.has(t.from_stage) && !reachable.has(t.to_stage)) {
          reachable.add(t.to_stage); changed = true;
        }
      }
    }
    for (const s of i.ir.stages) {
      if (!reachable.has(s.name)) {
        out.push({ level: 'warn', message: `[OSE/转移完整性] 阶段「${s.name}」从任何主体当前阶段都不可达` });
      }
    }
  }
  return out;
}

function checkSignalValidity(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  // 收集所有转移触发条件中引用的左值
  const referenced = new Set<string>();
  for (const t of i.ir.transitions) {
    if (t.trigger) {
      const left = String(t.trigger.left || '').replace(/^候选[.·]?/, '').trim();
      if (left) referenced.add(left);
    }
  }
  const signalNames = new Set(i.ir.signals.map(s => s.name));
  // 被引用但未声明
  for (const r of referenced) {
    if (!signalNames.has(r)) {
      out.push({ level: 'warn', message: `[OSE/信号有效性] 转移条件引用「${r}」但未声明为 信号` });
    }
  }
  // 已声明但无人引用
  for (const s of i.ir.signals) {
    if (!referenced.has(s.name)) {
      out.push({ level: 'warn', message: `[OSE/信号有效性] 信号「${s.name}」未被任何阶段转移引用,可能为僵尸信号` });
    }
    if (s.intensity == null || Number.isNaN(s.intensity)) {
      out.push({ level: 'warn', message: `[OSE/信号有效性] 信号「${s.name}」缺失合法强度` });
    }
  }
  return out;
}

function checkRegenerationIsolation(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  const subjectNames = new Set(i.ir.subjects.map(s => s.name));
  for (const r of i.ir.regenerations) {
    if (!r.subject_ref) {
      out.push({ level: 'warn', message: `[OSE/再生孤立] 再生事件「${r.name}」未绑定任何主体` });
      continue;
    }
    if (!subjectNames.has(r.subject_ref)) {
      out.push({ level: 'warn', message: `[OSE/再生孤立] 再生事件「${r.name}」绑定的主体「${r.subject_ref}」未声明` });
    }
    if (!r.failure || !r.diagnosis || !r.recompose) {
      out.push({ level: 'warn', message: `[OSE/再生孤立] 再生事件「${r.name}」失配/诊断/重组 字段不完整` });
    }
  }
  return out;
}

// ---------- Phase 2.3 hooks: 第一梯队治理 ----------

function checkFunctionRisk(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  const funcByName = new Map(i.ir.functions.map(f => [f.name, f]));

  // —— 业务性 warn(保留) ——
  for (const fn of i.ir.functions) {
    if (fn.body.length === 0) {
      out.push({ level: 'warn', message: `[OSE/函数风险] 函数「${fn.name}」函数体为空` });
      continue;
    }
    const hasReturn = fn.body.some((b: any) => {
      if (b && b.action_type === 'return') return true;
      if (b && Array.isArray(b.actions)) return b.actions.some((a: any) => a.action_type === 'return');
      return false;
    });
    if (!hasReturn) {
      out.push({ level: 'warn', message: `[OSE/函数风险] 函数「${fn.name}」无任何 返回 语句` });
    }
    const bodyStr = JSON.stringify(fn.body);
    if (bodyStr.includes(`"${fn.name}"`)) {
      out.push({ level: 'warn', message: `[OSE/函数风险] 函数「${fn.name}」可能存在自递归调用` });
    }
  }

  // —— Phase 2.4 结构性 error(硬阻塞) ——
  // 收集所有函数调用点(规则 actions + 函数体内嵌 actions),按 (来源, name, argCount) 校验
  type CallSite = { source: string; name: string; argCount: number };
  const sites: CallSite[] = [];
  const collectFromActions = (source: string, actions: any[]) => {
    for (const a of actions || []) {
      if (a && a.action_type === 'call' && a.payload?.call) {
        const c = a.payload.call as { name: string; args?: string[] };
        sites.push({ source, name: c.name, argCount: (c.args || []).length });
      }
      if (a && Array.isArray(a.actions)) collectFromActions(source, a.actions);
    }
  };
  for (const r of i.ir.rules) collectFromActions(`规则「${r.name}」`, r.actions as any[]);
  for (const fn of i.ir.functions) collectFromActions(`函数「${fn.name}」`, fn.body as any[]);

  for (const s of sites) {
    const target = funcByName.get(s.name);
    if (!target) {
      out.push({
        level: 'error',
        message: `[OSE/函数风险] ${s.source} 调用了未定义函数「${s.name}」 (BLOCK)`,
      });
      continue;
    }
    const expected = target.params.length;
    if (s.argCount !== expected) {
      out.push({
        level: 'error',
        message: `[OSE/函数风险] ${s.source} 调用「${s.name}」参数数量不匹配:期望 ${expected}, 实际 ${s.argCount} (BLOCK)`,
      });
    }
  }

  // —— 派生字段层:前端实时调用的函数也要检查参数对齐 ——
  // 形态:frontend.views[].derivedFields[].functionName + argFields
  if (i.frontend) {
    for (const v of i.frontend.views) {
      for (const d of v.derivedFields || []) {
        const target = funcByName.get(d.functionName);
        if (!target) {
          out.push({
            level: 'error',
            message: `[OSE/函数风险] 视图「${v.id}」派生字段「${d.label}」引用未定义函数「${d.functionName}」 (BLOCK)`,
          });
          continue;
        }
        if (d.argFields.length !== target.params.length) {
          out.push({
            level: 'error',
            message: `[OSE/函数风险] 视图「${v.id}」派生字段「${d.label}」参数数 ${d.argFields.length} ≠ 函数「${d.functionName}」期望 ${target.params.length} (BLOCK)`,
          });
        }
      }
    }
  }

  return out;
}

function checkBlockIntegrity(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  if (i.ir.concept_blocks.length === 0) return out;
  const cnames = new Set(i.ir.concept_blocks.map(c => c.name));
  // 结构性 block_with_fix_hint:命题/关系块引用悬空
  for (const p of i.ir.proposition_blocks) {
    if (p.subject && !cnames.has(p.subject)) {
      out.push({
        level: 'error', severity: 'block_with_fix_hint',
        policyId: 'ose.blockIntegrity.dangling_ref',
        message: `[OSE/块完整性] 命题块「${p.name}」.主语「${p.subject}」无对应概念块 (BLOCK)`,
        nodeRef: p.name,
        fixHint: { summary: `概念块「${p.subject}」未声明,请补充声明或修正引用`, action: 'add_declaration', target: p.subject },
      });
    }
    if (p.object && !cnames.has(p.object)) {
      out.push({
        level: 'error', severity: 'block_with_fix_hint',
        policyId: 'ose.blockIntegrity.dangling_ref',
        message: `[OSE/块完整性] 命题块「${p.name}」.宾语「${p.object}」无对应概念块 (BLOCK)`,
        nodeRef: p.name,
        fixHint: { summary: `概念块「${p.object}」未声明,请补充声明或修正引用`, action: 'add_declaration', target: p.object },
      });
    }
  }
  for (const r of i.ir.relation_blocks) {
    if (r.source && !cnames.has(r.source)) {
      out.push({
        level: 'error', severity: 'block_with_fix_hint',
        policyId: 'ose.blockIntegrity.dangling_ref',
        message: `[OSE/块完整性] 关系块「${r.name}」.源「${r.source}」无对应概念块 (BLOCK)`,
        nodeRef: r.name,
        fixHint: { summary: `概念块「${r.source}」未声明,请补充声明或修正引用`, action: 'add_declaration', target: r.source },
      });
    }
    if (r.target && !cnames.has(r.target)) {
      out.push({
        level: 'error', severity: 'block_with_fix_hint',
        policyId: 'ose.blockIntegrity.dangling_ref',
        message: `[OSE/块完整性] 关系块「${r.name}」.靶「${r.target}」无对应概念块 (BLOCK)`,
        nodeRef: r.name,
        fixHint: { summary: `概念块「${r.target}」未声明,请补充声明或修正引用`, action: 'add_declaration', target: r.target },
      });
    }
  }
  // 业务性 warn:孤立块
  const referenced = new Set<string>();
  i.ir.proposition_blocks.forEach(p => { if (p.subject) referenced.add(p.subject); if (p.object) referenced.add(p.object); });
  i.ir.relation_blocks.forEach(r => { if (r.source) referenced.add(r.source); if (r.target) referenced.add(r.target); });
  for (const c of i.ir.concept_blocks) {
    if (!referenced.has(c.name)) {
      out.push({
        level: 'warn', severity: 'warn',
        policyId: 'ose.blockIntegrity.orphan',
        message: `[OSE/块完整性] 概念块「${c.name}」未被任何命题/关系引用 (孤立)`,
        nodeRef: c.name,
      });
    }
  }
  return out;
}

// ---------- Phase 2.5:stageReachability(可达性裁决) ----------

function checkStageReachability(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  if (i.ir.subjects.length === 0 || i.ir.stages.length === 0) return out;
  const stageNames = new Set(i.ir.stages.map(s => s.name));

  for (const subj of i.ir.subjects) {
    if (subj.current_stage && !stageNames.has(subj.current_stage)) {
      out.push({
        level: 'error', severity: 'block_with_fix_hint',
        policyId: 'ose.stageReachability.invalid_initial',
        message: `[OSE/阶段可达] 主体「${subj.name}」初始阶段「${subj.current_stage}」未声明 (BLOCK)`,
        nodeRef: subj.name,
        fixHint: { summary: `声明阶段「${subj.current_stage}」或修正主体初始阶段`, action: 'add_declaration', target: subj.current_stage },
      });
    }
  }

  for (const t of i.ir.transitions) {
    if (t.to_stage && !stageNames.has(t.to_stage)) {
      out.push({
        level: 'error', severity: 'block_with_fix_hint',
        policyId: 'ose.stageReachability.unknown_target',
        message: `[OSE/阶段可达] 转移「${t.name}」目标阶段「${t.to_stage}」未声明 (BLOCK)`,
        nodeRef: t.name,
        fixHint: { summary: `声明阶段「${t.to_stage}」或修正转移目标`, action: 'add_declaration', target: t.to_stage },
      });
    }
  }

  if (i.ir.transitions.length > 0) {
    const reachable = new Set<string>();
    i.ir.subjects.forEach(s => s.current_stage && stageNames.has(s.current_stage) && reachable.add(s.current_stage));
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of i.ir.transitions) {
        if (reachable.has(t.from_stage) && stageNames.has(t.to_stage) && !reachable.has(t.to_stage)) {
          reachable.add(t.to_stage); changed = true;
        }
      }
    }
    for (const s of i.ir.stages) {
      if (!reachable.has(s.name)) {
        out.push({
          level: 'error', severity: 'block',
          policyId: 'ose.stageReachability.unreachable',
          message: `[OSE/阶段可达] 阶段「${s.name}」从任何主体初始阶段都不可达 (BLOCK)`,
          nodeRef: s.name,
        });
      }
    }
  }

  return out;
}

// ---------- Phase 2.5:mappingCoverage(覆盖度裁决) ----------

function checkMappingCoverage(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  if (i.ir.mapping_tables.length === 0) return out;

  for (const t of i.ir.mapping_tables) {
    if (!t.columns || t.columns.length === 0) {
      out.push({
        level: 'error', severity: 'block_with_fix_hint',
        policyId: 'ose.mappingCoverage.domain_missing',
        message: `[OSE/映射覆盖] 映射表「${t.name}」未声明任何域(列) (BLOCK)`,
        nodeRef: t.name,
        fixHint: { summary: `为映射表「${t.name}」补充域列声明`, action: 'complete_field', target: t.name },
      });
      continue;
    }
    if (!t.rows || t.rows.length === 0) {
      out.push({
        level: 'warn', severity: 'warn',
        policyId: 'ose.mappingCoverage.empty_rows',
        message: `[OSE/映射覆盖] 映射表「${t.name}」无任何映射条目`,
        nodeRef: t.name,
      });
    }
  }
  return out;
}

function checkBoundaryIntegrity(i: OSEInput): ProjectionDiagnostic[] {
  const out: ProjectionDiagnostic[] = [];
  for (const t of i.ir.mapping_tables) {
    if (!t.aligned) {
      out.push({
        level: 'error', severity: 'block_with_fix_hint',
        policyId: 'ose.boundaryIntegrity.misaligned',
        message: `[OSE/边界完整性] 映射表「${t.name}」错位行 ${t.misaligned_rows.join('、')} (BLOCK)`,
        nodeRef: t.name,
        fixHint: { summary: `补齐映射表「${t.name}」错位行的列数`, action: 'complete_field', target: t.name },
      });
    }
  }
  for (const c of i.ir.closures) {
    if (!c.closed) {
      out.push({
        level: 'error', severity: 'block_with_fix_hint',
        policyId: 'ose.boundaryIntegrity.unclosed',
        message: `[OSE/边界完整性] 封口「${c.name}」未闭合: 声明 ${c.total} ≠ 实际 ${c.computed_sum} (BLOCK)`,
        nodeRef: c.name,
        fixHint: { summary: `调整封口「${c.name}」的分项之和使其等于声明总量`, action: 'complete_field', target: c.name },
      });
    }
  }
  for (const ch of i.ir.correspondence_chains) {
    if (!ch.aligned) {
      out.push({
        level: 'error', severity: 'block',
        policyId: 'ose.boundaryIntegrity.broken_chain',
        message: `[OSE/边界完整性] 同位链「${ch.name}」断裂: ${ch.items.length} 项 ≠ ${ch.domains.length} 域 (BLOCK)`,
        nodeRef: ch.name,
      });
    }
  }
  for (const e of i.ir.domain_expansions) {
    const expected = e.mother_law_values.length;
    for (const f of e.factors) {
      if (f.items.length !== expected) {
        out.push({
          level: 'warn', severity: 'warn',
          policyId: 'ose.boundaryIntegrity.incomplete_expansion',
          message: `[OSE/边界完整性] 域展开「${e.name}」域「${f.domain}」五因数 ${f.items.length} ≠ 母法值数 ${expected}`,
          nodeRef: e.name,
        });
      }
    }
  }
  return out;
}

// ---------- 总入口 ----------
export function runOSEOnProjection(input: OSEInput): OSEReport {
  return {
    problemDefinition: checkProblemDefinition(input),
    structuralConsistency: checkStructuralConsistency(input),
    risks: raiseRisks(input),
    assumptions: surfaceAssumptions(input),
    routeConsistency: checkRouteConsistency(input),
    multiConceptCoverage: checkMultiConceptCoverage(input),
    deadRouteDetection: checkDeadRoute(input),
    stageLegality: checkStageLegality(input),
    transitionCompleteness: checkTransitionCompleteness(input),
    signalValidity: checkSignalValidity(input),
    regenerationIsolation: checkRegenerationIsolation(input),
    functionRisk: checkFunctionRisk(input),
    blockIntegrity: checkBlockIntegrity(input),
    boundaryIntegrity: checkBoundaryIntegrity(input),
    // Phase 2.5
    stageReachability: checkStageReachability(input),
    mappingCoverage: checkMappingCoverage(input),
  };
}

export function flattenOSEReport(r: OSEReport): ProjectionDiagnostic[] {
  return [
    ...r.problemDefinition,
    ...r.structuralConsistency,
    ...r.risks,
    ...r.assumptions,
    ...(r.routeConsistency || []),
    ...(r.multiConceptCoverage || []),
    ...(r.deadRouteDetection || []),
    ...(r.stageLegality || []),
    ...(r.transitionCompleteness || []),
    ...(r.signalValidity || []),
    ...(r.regenerationIsolation || []),
    ...(r.functionRisk || []),
    ...(r.blockIntegrity || []),
    ...(r.boundaryIntegrity || []),
    ...(r.stageReachability || []),
    ...(r.mappingCoverage || []),
  ];
}

/**
 * Phase 2.5:裁决层升级
 * blocked 触发面覆盖所有 severity='block' / 'block_with_fix_hint' 的诊断;
 * 同时保留旧的 level==='error' 触发(向后兼容未补 severity 的历史诊断)
 */
export function computeBlocked(r: OSEReport): { blocked: boolean; reasons: string[]; summary: { pass: number; warn: number; block: number } } {
  const all = flattenOSEReport(r);
  const isBlock = (d: ProjectionDiagnostic) =>
    d.severity === 'block' || d.severity === 'block_with_fix_hint' ||
    (d.severity === undefined && d.level === 'error');
  const reasons = all.filter(isBlock).map(d => d.message);

  let pass = 0, warn = 0, block = 0;
  for (const d of all) {
    if (isBlock(d)) block++;
    else if (d.severity === 'warn' || (d.severity === undefined && d.level === 'warn')) warn++;
    else pass++;
  }
  return { blocked: block > 0, reasons, summary: { pass, warn, block } };
}
