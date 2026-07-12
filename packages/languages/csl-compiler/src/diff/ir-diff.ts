// CSL Diff — IR diff (按桶分组,按 name 配对)
// MVP-2 Phase 7

import type { IRContainer } from '../types';

export interface IRDiff {
  status: 'ok' | 'left_failed' | 'right_failed' | 'both_failed';
  buckets: Record<string, {
    added: string[];
    removed: string[];
    changed: Array<{ name: string; fields: string[] }>;
  }>;
  meta: {
    leftNodeCount: number;
    rightNodeCount: number;
    delta: number;
  };
}

const BUCKETS = [
  'concepts','entities','attributes','relations',
  'invariants','rules','evidences',
  'functions','templates',
  'subjects','stages','transitions',
  'compiler_layers','regenerations','signals',
  'mapping_tables','closures','correspondence_chains','domain_expansions',
  'units','establishments','profiles','tradeoffs',
  'engines','engine_modules','engine_actions','engine_axes',
  'concept_blocks','proposition_blocks','relation_blocks',
];

function nameOf(item: any, idx: number): string {
  return item?.name || item?.id || `#${idx}`;
}

function diffFields(a: any, b: any): string[] {
  const fields: string[] = [];
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    if (k === 'name' || k === 'id') continue;
    if (JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k])) fields.push(k);
  }
  return fields;
}

function countNodes(ir: IRContainer | null): number {
  if (!ir) return 0;
  let n = 0;
  for (const k of BUCKETS) {
    const arr = (ir as any)[k];
    if (Array.isArray(arr)) n += arr.length;
  }
  return n;
}

export function diffIR(left: IRContainer | null, right: IRContainer | null): IRDiff {
  const empty = { added: [], removed: [], changed: [] };
  const buckets: IRDiff['buckets'] = {};
  const meta = {
    leftNodeCount: countNodes(left),
    rightNodeCount: countNodes(right),
    delta: countNodes(right) - countNodes(left),
  };

  if (!left && !right) {
    return { status: 'both_failed', buckets: {}, meta };
  }
  if (!left) {
    for (const b of BUCKETS) buckets[b] = { added: [], removed: [], changed: [] };
    return { status: 'left_failed', buckets, meta };
  }
  if (!right) {
    for (const b of BUCKETS) buckets[b] = { added: [], removed: [], changed: [] };
    return { status: 'right_failed', buckets, meta };
  }

  for (const b of BUCKETS) {
    const la: any[] = (left as any)[b] ?? [];
    const ra: any[] = (right as any)[b] ?? [];
    const lMap = new Map<string, any>();
    const rMap = new Map<string, any>();
    la.forEach((it, i) => lMap.set(nameOf(it, i), it));
    ra.forEach((it, i) => rMap.set(nameOf(it, i), it));

    const added: string[] = [];
    const removed: string[] = [];
    const changed: Array<{ name: string; fields: string[] }> = [];

    for (const [k, lv] of lMap) {
      const rv = rMap.get(k);
      if (!rv) removed.push(k);
      else {
        const fields = diffFields(lv, rv);
        if (fields.length > 0) changed.push({ name: k, fields });
      }
    }
    for (const k of rMap.keys()) {
      if (!lMap.has(k)) added.push(k);
    }

    if (added.length || removed.length || changed.length) {
      buckets[b] = { added, removed, changed };
    }
  }

  return { status: 'ok', buckets, meta };
}
