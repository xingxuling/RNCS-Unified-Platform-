// CSL 全栈投影 — Backend Codegen
// Phase 2.0:多 endpoint + handlers.ts + route.ts
// 兼容入口 generateBackendSource(p) 仍返回主 endpoint handler 源码

import type { BackendProjection, EndpointProjection } from './types';

// ---------- 单 endpoint handler 源码 ----------

function generateOneHandler(e: EndpointProjection): string {
  if (e.stageKind === 'transition') return generateStageHandler(e);
  if (e.stageKind === 'summary') return generateSummaryHandler(e);
  return generateDefaultHandler(e);
}

function generateSummaryHandler(e: EndpointProjection): string {
  const snap = JSON.stringify(e.summarySnapshot || {}, null, 2);
  return `// 由 CSL 投影自动生成 — ${e.method} ${e.endpoint} (subject summary)
// 主体: ${e.subjectRef} · 静态快照,投影时固化

export interface ${e.handlerName}Input {}

export function ${e.handlerName}(_input: ${e.handlerName}Input) {
  return {
    ok: true,
    summary: ${snap},
  };
}
`;
}

function generateStageHandler(e: EndpointProjection): string {
  const inputType = Object.entries(e.inputSchema)
    .map(([k, t]) => `  '${k}': ${t};`)
    .join('\n');
  const transitions = e.stageTransitions || [];
  const transitionsCode = transitions.length === 0
    ? '  // (无转移规则)'
    : transitions.map(t => `  // ${t.name}: ${t.fromStage} → ${t.toStage} 触发=${t.rawTrigger}
  if (currentStage === ${JSON.stringify(t.fromStage)} && (${t.jsCondition})) {
    matchedTransition = ${JSON.stringify(t.name)};
    nextStage = ${JSON.stringify(t.toStage)};
    trace.push(\`匹配转移「${t.name}」: ${t.fromStage} → ${t.toStage}\`);
  } else {
    trace.push(\`未命中「${t.name}」(${t.fromStage} → ${t.toStage})\`);
  }`).join('\n');

  const regens = e.regenerationsForSubject || [];
  const regenCode = regens.length === 0
    ? '  const triggeredRegenerations: string[] = [];'
    : `  const triggeredRegenerations: string[] = matchedTransition ? ${JSON.stringify(regens)} : [];`;

  const inputTypeName = `${e.handlerName}Input`;
  return `// 由 CSL 投影自动生成 — ${e.method} ${e.endpoint} (stage: ${e.subjectRef})
// 阶段转移判定 handler · 纯函数式 · 无状态

export interface ${inputTypeName} {
${inputType || '  // (无入参字段)'}
}

export interface StageTransitionResponse {
  ok: boolean;
  fromStage: string;
  toStage: string;
  matchedTransition: string | null;
  triggeredRegenerations: string[];
  trace: string[];
}

export function ${e.handlerName}(input: ${inputTypeName}): StageTransitionResponse {
  const trace: string[] = [];
  const currentStage = (input["__current_stage__"] as string) || ${JSON.stringify(e.defaultStage || '')};
  trace.push(\`输入信号=\${input["__signal_name__"]} 强度=\${input["__signal_intensity__"]} 当前阶段=\${currentStage}\`);

  let matchedTransition: string | null = null;
  let nextStage: string = currentStage;

${transitionsCode}

${regenCode}

  return {
    ok: true,
    fromStage: currentStage,
    toStage: nextStage,
    matchedTransition,
    triggeredRegenerations,
    trace,
  };
}
`;
}

function generateDefaultHandler(e: EndpointProjection): string {
  const inputType = Object.entries(e.inputSchema)
    .map(([k, t]) => `  '${k}': ${t};`)
    .join('\n');

  const invariantBlock = e.invariantChecks.length === 0
    ? '  // (无不变量)'
    : e.invariantChecks
        .map(c => `  if (!(${c.jsExpression})) errors.push(${JSON.stringify(c.failureMessage)});`)
        .join('\n');

  const ruleBlock = e.ruleEvaluations.length === 0
    ? '  // (无规则)'
    : e.ruleEvaluations
        .map(r => `  if (${r.jsCondition}) marks.push(${JSON.stringify(r.markLabel)});`)
        .join('\n');

  const passedInvariants = e.invariantChecks.length > 0
    ? `[${e.invariantChecks.map(c => JSON.stringify(c.name)).join(', ')}]`
    : '[]';

  const inputTypeName = `${e.handlerName}Input`;

  return `// 由 CSL 投影自动生成 — ${e.method} ${e.endpoint}
// 主概念: ${e.primaryConcept} · view: ${e.viewId}

export interface ${inputTypeName} {
${inputType || '  // (无入参字段)'}
}

export function ${e.handlerName}(input: ${inputTypeName}): HandlerResponse {
  const errors: string[] = [];

  // ---- 不变量校验 ----
${invariantBlock}

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // ---- 规则评估 ----
  const marks: string[] = [];
${ruleBlock}

  return {
    ok: true,
    results: {
      invariants: ${passedInvariants},
      rules: marks,
    },
  };
}
`;
}

// ---------- 主入口:统一返回 handlers.ts(包含所有 endpoint handler) ----------

export function generateBackendSource(p: BackendProjection): string {
  if (p.endpoints.length === 0) {
    return `// (空 backend)
export interface HandlerResponse { ok: boolean; errors?: string[]; results?: { invariants: string[]; rules: string[] }; }
`;
  }

  const head = `// 由 CSL 投影自动生成 — 共 ${p.endpoints.length} 个 endpoint handler
// 请勿手工修改

export interface HandlerResponse {
  ok: boolean;
  errors?: string[];
  results?: { invariants: string[]; rules: string[] };
}
`;

  return head + '\n' + p.endpoints.map(generateOneHandler).join('\n');
}

// ---------- 多文件产物:handlers.ts + route.ts ----------

export function generateBackendFiles(p: BackendProjection): Record<string, string> {
  const files: Record<string, string> = {};
  files['handlers.ts'] = generateBackendSource(p);
  files['route.ts'] = generateMultiRouteSource(p);
  return files;
}

function generateMultiRouteSource(p: BackendProjection): string {
  if (p.endpoints.length === 0) {
    return `import { Router } from 'express';
export const router = Router();
`;
  }

  const importNames = p.endpoints.map(e => e.handlerName).join(', ');
  const importTypes = p.endpoints
    .filter(e => Object.keys(e.inputSchema).length > 0)
    .map(e => `${e.handlerName}Input`).join(', ');

  const routeBlocks = p.endpoints.map(e => {
    if (e.method === 'GET') {
      return `router.get('${e.endpoint}', (_req: Request, res: Response) => {
  // GET / summary 视图:无入参,直接调用 handler 取规则状态
  const result = ${e.handlerName}({} as ${e.handlerName}Input);
  res.status(result.ok ? 200 : 422).json(result);
});`;
    }
    return `router.post('${e.endpoint}', (req: Request, res: Response) => {
  const input = req.body as ${e.handlerName}Input;
  const result = ${e.handlerName}(input);
  res.status(result.ok ? 200 : 422).json(result);
});`;
  }).join('\n\n');

  return `// 由 CSL 投影自动生成 — Express 路由
// ${p.endpoints.length} 条路由

import { Router, type Request, type Response } from 'express';
import { ${importNames}${importTypes ? ', ' + importTypes : ''} } from './handlers';

export const router = Router();

${routeBlocks}
`;
}

// ---------- 浏览器内可执行 handler 工厂(Phase 2.0:按 viewId 索引) ----------

export interface RuntimeHandlerResponse {
  ok: boolean;
  errors?: string[];
  results?: { invariants: string[]; rules: string[] };
  // Phase 2.1: stage 模式扩展字段
  fromStage?: string;
  toStage?: string;
  matchedTransition?: string | null;
  triggeredRegenerations?: string[];
  trace?: string[];
  // Phase 2.2: summary 模式
  summary?: unknown;
  blocked?: boolean;
  blockReasons?: string[];
}

export function buildRuntimeHandler(p: BackendProjection): (input: Record<string, unknown>) => RuntimeHandlerResponse {
  if (p.endpoints.length === 0) return () => ({ ok: true, results: { invariants: [], rules: [] } });
  return buildHandlerFor(p.endpoints[0]);
}

export function buildRuntimeHandlersByView(
  p: BackendProjection,
): Record<string, (input: Record<string, unknown>) => RuntimeHandlerResponse> {
  const out: Record<string, (input: Record<string, unknown>) => RuntimeHandlerResponse> = {};
  for (const e of p.endpoints) {
    out[e.viewId] = buildHandlerFor(e);
  }
  return out;
}

function buildHandlerFor(e: EndpointProjection) {
  if (e.stageKind === 'transition') return buildStageHandler(e);
  if (e.stageKind === 'summary') return buildSummaryHandler(e);

  const invFns = e.invariantChecks.map(c => ({
    name: c.name, msg: c.failureMessage, fn: safeCompile(c.jsExpression),
  }));
  const ruleFns = e.ruleEvaluations.map(r => ({
    name: r.name, label: r.markLabel, fn: safeCompile(r.jsCondition),
  }));

  return (input: Record<string, unknown>): RuntimeHandlerResponse => {
    const errors: string[] = [];
    for (const i of invFns) {
      try { if (!i.fn(input)) errors.push(i.msg); }
      catch (err) { errors.push(`${i.name} 求值异常: ${(err as Error).message}`); }
    }
    if (errors.length) return { ok: false, errors };
    const marks: string[] = [];
    for (const r of ruleFns) {
      try { if (r.fn(input)) marks.push(r.label); } catch { /* noop */ }
    }
    return { ok: true, results: { invariants: invFns.map(i => i.name), rules: marks } };
  };
}

function buildSummaryHandler(e: EndpointProjection) {
  const snapshot = e.summarySnapshot;
  return (_input: Record<string, unknown>): RuntimeHandlerResponse => {
    return { ok: true, summary: snapshot };
  };
}

function buildStageHandler(e: EndpointProjection) {
  const blocked = !!e.blocked;
  const blockReasons = e.blockReasons || [];
  const transitions = (e.stageTransitions || []).map(t => ({
    name: t.name, from: t.fromStage, to: t.toStage,
    fn: safeCompile(t.jsCondition), raw: t.rawTrigger,
  }));
  const regens = e.regenerationsForSubject || [];
  const defaultStage = e.defaultStage || '';

  return (input: Record<string, unknown>): RuntimeHandlerResponse => {
    const trace: string[] = [];
    if (blocked) {
      return {
        ok: false,
        blocked: true,
        blockReasons,
        errors: ['[BLOCKED] 阶段非法,runtime 已拒绝执行阶段迁移', ...blockReasons],
        trace: ['handler 被 OSE 阶段合法性硬阻塞,未执行任何转移判定'],
        fromStage: (input["__current_stage__"] as string) || defaultStage,
        toStage: (input["__current_stage__"] as string) || defaultStage,
        matchedTransition: null,
        triggeredRegenerations: [],
      };
    }
    const currentStage = (input["__current_stage__"] as string) || defaultStage;
    trace.push(`输入信号=${input["__signal_name__"]} 强度=${input["__signal_intensity__"]} 当前阶段=${currentStage}`);

    let matched: string | null = null;
    let nextStage = currentStage;
    for (const t of transitions) {
      if (currentStage !== t.from) {
        trace.push(`未命中「${t.name}」(当前阶段非 ${t.from})`);
        continue;
      }
      try {
        if (t.fn(input)) {
          matched = t.name;
          nextStage = t.to;
          trace.push(`匹配转移「${t.name}」: ${t.from} → ${t.to} (条件 ${t.raw})`);
          break;
        } else {
          trace.push(`未命中「${t.name}」(条件 ${t.raw} 不满足)`);
        }
      } catch (err) {
        trace.push(`「${t.name}」求值异常: ${(err as Error).message}`);
      }
    }
    return {
      ok: true,
      fromStage: currentStage,
      toStage: nextStage,
      matchedTransition: matched,
      triggeredRegenerations: matched ? regens : [],
      trace,
    };
  };
}

function safeCompile(expr: string): (input: Record<string, unknown>) => boolean {
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('input', `"use strict"; return (${expr || 'true'});`);
    return (input) => Boolean(f(input));
  } catch {
    return () => false;
  }
}

