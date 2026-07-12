// L2 影子 inspect / summary / compare (P13)
//
// 仅供 Viewer / Compare / summary 解释新语法对象,不参与运行。

import type { L2IR, L2IREngine, L2IRModule, L2IRResponsibility, L2IRConstraint } from './types';

export interface L2Summary {
  version: 'v0.10-alpha';
  counts: {
    engines: number;
    modules: number;
    responsibilities: number;
    constraints: number;
  };
  /** 每个对象一行,简洁可读 */
  lines: string[];
}

function engineLine(e: L2IREngine): string {
  const mods = e.modules.length ? `模块=${e.modules.join('/')}` : '模块=∅';
  const res = e.responsibilities.length ? `职责=${e.responsibilities.join('/')}` : '职责=∅';
  return `[引擎] ${e.name}  ${mods}  ${res}`;
}

function moduleLine(m: L2IRModule): string {
  const pre = m.pre.length ? `前置=${m.pre.join(',')}` : '前置=∅';
  const post = m.post.length ? `后置=${m.post.join(',')}` : '后置=∅';
  return `[模块] ${m.name}  ${pre}  ${post}`;
}
function respLine(r: L2IRResponsibility): string {
  return `[职责] ${r.name}  归属=${r.owner ?? '∅'}`;
}
function constraintLine(c: L2IRConstraint): string {
  const kw = c.kind === 'pre' ? '前置' : '后置';
  return `[约束 ${kw}] ${c.name}: ${c.expr}`;
}

export function summarizeL2(ir: L2IR): L2Summary {
  const lines: string[] = [
    ...ir.engines.map(engineLine),
    ...ir.modules.map(moduleLine),
    ...ir.responsibilities.map(respLine),
    ...ir.constraints.map(constraintLine),
  ];
  return {
    version: 'v0.10-alpha',
    counts: {
      engines: ir.engines.length,
      modules: ir.modules.length,
      responsibilities: ir.responsibilities.length,
      constraints: ir.constraints.length,
    },
    lines,
  };
}

// ---------- Compare ----------

export type L2DiffKind = 'add' | 'del' | 'mod' | 'same';

export interface L2DiffEntry {
  kind: L2DiffKind;
  category: 'engine' | 'module' | 'responsibility' | 'constraint';
  name: string;
  /** 关键字段差异 — 仅在 mod 时给出 */
  fieldDiffs?: Array<{ field: string; left?: string; right?: string }>;
}

export interface L2CompareReport {
  version: 'v0.10-alpha';
  entries: L2DiffEntry[];
  counts: { add: number; del: number; mod: number; same: number };
}

function indexBy<T extends { name: string }>(arr: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const x of arr) m.set(x.name, x);
  return m;
}

function diffStringList(field: string, a: string[], b: string[]): { field: string; left?: string; right?: string } | null {
  const sa = [...a].sort().join(',');
  const sb = [...b].sort().join(',');
  if (sa === sb) return null;
  return { field, left: sa || '∅', right: sb || '∅' };
}

function diffEngine(left: L2IREngine, right: L2IREngine): L2DiffEntry {
  const fieldDiffs: NonNullable<L2DiffEntry['fieldDiffs']> = [];
  const m = diffStringList('modules', left.modules, right.modules);
  const r = diffStringList('responsibilities', left.responsibilities, right.responsibilities);
  if (m) fieldDiffs.push(m);
  if (r) fieldDiffs.push(r);
  return {
    kind: fieldDiffs.length ? 'mod' : 'same',
    category: 'engine', name: left.name,
    fieldDiffs: fieldDiffs.length ? fieldDiffs : undefined,
  };
}

function diffModule(left: L2IRModule, right: L2IRModule): L2DiffEntry {
  const fieldDiffs: NonNullable<L2DiffEntry['fieldDiffs']> = [];
  const p = diffStringList('pre', left.pre, right.pre);
  const q = diffStringList('post', left.post, right.post);
  if (p) fieldDiffs.push(p);
  if (q) fieldDiffs.push(q);
  return {
    kind: fieldDiffs.length ? 'mod' : 'same',
    category: 'module', name: left.name,
    fieldDiffs: fieldDiffs.length ? fieldDiffs : undefined,
  };
}

function diffResp(left: L2IRResponsibility, right: L2IRResponsibility): L2DiffEntry {
  if ((left.owner ?? '') === (right.owner ?? '')) {
    return { kind: 'same', category: 'responsibility', name: left.name };
  }
  return {
    kind: 'mod', category: 'responsibility', name: left.name,
    fieldDiffs: [{ field: 'owner', left: left.owner ?? '∅', right: right.owner ?? '∅' }],
  };
}

function diffConstraint(left: L2IRConstraint, right: L2IRConstraint): L2DiffEntry {
  const fieldDiffs: NonNullable<L2DiffEntry['fieldDiffs']> = [];
  if (left.kind !== right.kind) fieldDiffs.push({ field: 'kind', left: left.kind, right: right.kind });
  if (left.expr !== right.expr) fieldDiffs.push({ field: 'expr', left: left.expr, right: right.expr });
  return {
    kind: fieldDiffs.length ? 'mod' : 'same',
    category: 'constraint', name: left.name,
    fieldDiffs: fieldDiffs.length ? fieldDiffs : undefined,
  };
}

function diffCategory<T extends { name: string }>(
  category: L2DiffEntry['category'],
  leftArr: T[], rightArr: T[],
  diffOne: (a: T, b: T) => L2DiffEntry,
): L2DiffEntry[] {
  const out: L2DiffEntry[] = [];
  const li = indexBy(leftArr);
  const ri = indexBy(rightArr);
  const all = new Set<string>([...li.keys(), ...ri.keys()]);
  for (const name of all) {
    const a = li.get(name);
    const b = ri.get(name);
    if (a && b) out.push(diffOne(a, b));
    else if (a) out.push({ kind: 'del', category, name });
    else out.push({ kind: 'add', category, name });
  }
  return out;
}

export function compareL2(left: L2IR, right: L2IR): L2CompareReport {
  const entries: L2DiffEntry[] = [
    ...diffCategory('engine', left.engines, right.engines, diffEngine),
    ...diffCategory('module', left.modules, right.modules, diffModule),
    ...diffCategory('responsibility', left.responsibilities, right.responsibilities, diffResp),
    ...diffCategory('constraint', left.constraints, right.constraints, diffConstraint),
  ];
  const counts = { add: 0, del: 0, mod: 0, same: 0 };
  for (const e of entries) counts[e.kind]++;
  return { version: 'v0.10-alpha', entries, counts };
}
