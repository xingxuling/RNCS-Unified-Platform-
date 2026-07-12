// CSL Diff — AST diff (基于节点 kind + name 配对)
// MVP-2 Phase 7

import type { ProgramNode, ASTNode } from '../types';

export interface ASTDiff {
  status: 'ok' | 'left_failed' | 'right_failed' | 'both_failed';
  added:    Array<{ path: string; nodeKind: string; preview: string }>;
  removed:  Array<{ path: string; nodeKind: string; preview: string }>;
  changed:  Array<{ path: string; nodeKind: string; before: string; after: string }>;
  summary: { addedCount: number; removedCount: number; changedCount: number };
}

function nodeKey(n: ASTNode, idx: number): string {
  const name = (n as any).name || (n as any).id || '';
  return name ? `${n.type}:${name}` : `${n.type}#${idx}`;
}

function preview(n: ASTNode): string {
  const s = JSON.stringify(n);
  return s.length > 80 ? s.slice(0, 77) + '...' : s;
}

export function diffAST(left: ProgramNode | null, right: ProgramNode | null): ASTDiff {
  if (!left && !right) {
    return { status: 'both_failed', added: [], removed: [], changed: [], summary: { addedCount: 0, removedCount: 0, changedCount: 0 } };
  }
  if (!left) {
    return { status: 'left_failed', added: [], removed: [], changed: [], summary: { addedCount: 0, removedCount: 0, changedCount: 0 } };
  }
  if (!right) {
    return { status: 'right_failed', added: [], removed: [], changed: [], summary: { addedCount: 0, removedCount: 0, changedCount: 0 } };
  }

  const lMap = new Map<string, { node: ASTNode; idx: number }>();
  const rMap = new Map<string, { node: ASTNode; idx: number }>();
  left.body.forEach((n, i) => lMap.set(nodeKey(n, i), { node: n, idx: i }));
  right.body.forEach((n, i) => rMap.set(nodeKey(n, i), { node: n, idx: i }));

  const added: ASTDiff['added'] = [];
  const removed: ASTDiff['removed'] = [];
  const changed: ASTDiff['changed'] = [];

  for (const [k, lv] of lMap) {
    const rv = rMap.get(k);
    if (!rv) {
      removed.push({ path: k, nodeKind: lv.node.type, preview: preview(lv.node) });
    } else {
      const ls = JSON.stringify(lv.node);
      const rs = JSON.stringify(rv.node);
      if (ls !== rs) {
        changed.push({ path: k, nodeKind: lv.node.type, before: preview(lv.node), after: preview(rv.node) });
      }
    }
  }
  for (const [k, rv] of rMap) {
    if (!lMap.has(k)) {
      added.push({ path: k, nodeKind: rv.node.type, preview: preview(rv.node) });
    }
  }

  return {
    status: 'ok',
    added, removed, changed,
    summary: { addedCount: added.length, removedCount: removed.length, changedCount: changed.length },
  };
}
