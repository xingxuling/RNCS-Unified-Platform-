// CSL Diff — OSE diff (按 policyId / message 配对)
// MVP-2 Phase 7
//
// 当前 GuardLog 是 runtime 的诊断,不是 OSE projection diagnostic。
// MVP 阶段把 guardLog 视为 OSE 拦截信号的近似,粒度够用。

import type { CSLResult } from '../versions/dispatch';

export interface OSEDiagnosticLite {
  policyId: string;
  message: string;
  severity: string;
}

export interface OSEDiff {
  status: 'ok' | 'left_failed' | 'right_failed' | 'both_failed';
  newBlocks:   OSEDiagnosticLite[];     // right 新增
  resolved:    OSEDiagnosticLite[];     // left 有 right 无
  severityChanged: Array<{ policyId: string; left: string; right: string }>;
  blockedDelta: { left: boolean; right: boolean };
}

function extract(result: CSLResult): { items: OSEDiagnosticLite[]; blocked: boolean } {
  const items: OSEDiagnosticLite[] = [];
  const guardLog = result.guardLog || [];
  for (const g of guardLog) {
    items.push({ policyId: g.policyId, message: g.reason, severity: 'block' });
  }
  if (result.error) {
    items.push({ policyId: 'parse.error', message: result.error, severity: 'block' });
  }
  return { items, blocked: items.length > 0 };
}

function key(d: OSEDiagnosticLite): string {
  return `${d.policyId}::${d.message}`;
}

export function diffOSE(left: CSLResult | null, right: CSLResult | null): OSEDiff {
  if (!left && !right) return { status: 'both_failed', newBlocks: [], resolved: [], severityChanged: [], blockedDelta: { left: false, right: false } };
  if (!left)  return { status: 'left_failed',  newBlocks: [], resolved: [], severityChanged: [], blockedDelta: { left: false, right: !!right && extract(right).blocked } };
  if (!right) return { status: 'right_failed', newBlocks: [], resolved: [], severityChanged: [], blockedDelta: { left: extract(left).blocked, right: false } };

  const L = extract(left);
  const R = extract(right);
  const lMap = new Map(L.items.map(d => [key(d), d]));
  const rMap = new Map(R.items.map(d => [key(d), d]));

  const newBlocks: OSEDiagnosticLite[] = [];
  const resolved: OSEDiagnosticLite[] = [];
  const severityChanged: OSEDiff['severityChanged'] = [];

  for (const [k, lv] of lMap) {
    const rv = rMap.get(k);
    if (!rv) resolved.push(lv);
    else if (rv.severity !== lv.severity) {
      severityChanged.push({ policyId: lv.policyId, left: lv.severity, right: rv.severity });
    }
  }
  for (const [k, rv] of rMap) {
    if (!lMap.has(k)) newBlocks.push(rv);
  }

  return {
    status: 'ok',
    newBlocks, resolved, severityChanged,
    blockedDelta: { left: L.blocked, right: R.blocked },
  };
}
