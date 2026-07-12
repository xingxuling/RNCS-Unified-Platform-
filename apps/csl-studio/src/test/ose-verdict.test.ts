// Phase 2.5:OSE 裁决层升级最小验收
// 覆盖 block_with_fix_hint 生成、computeBlocked 升级、runtime guard OSE 联动
import { describe, it, expect } from 'vitest';
import { runOSEOnProjection, computeBlocked } from '@/csl/projection/ose-bridge';
import { guard } from '@/csl/runtime/guard';
import type { CapabilityProfile } from '@/csl/capability/profile';
import type { IRContainer } from '@/csl/types';

/** 最小 profile,避开 spec 加载链 */
const profile: CapabilityProfile = {
  id: 'test-v0.9',
  version: 'v0.9',
  runtimePermissions: {
    allowFunctionCall: true,
    allowStageTransition: true,
    allowRegeneration: true,
    allowSignalEmit: true,
    allowInference: true,
    allowCodegen: true,
  },
} as unknown as CapabilityProfile;

/** 构造最小 IR 骨架,允许注入 overrides */
function makeIR(overrides: Partial<IRContainer> = {}): IRContainer {
  const base: IRContainer = {
    concepts: [], instances: [], invariants: [], rules: [], evidences: [], functions: [],
    subjects: [], stages: [], transitions: [],
    compiler_layers: [], regenerations: [], signals: [],
    mapping_tables: [], closures: [], correspondence_chains: [], domain_expansions: [],
    units: [], establishments: [], profiles: [], tradeoffs: [],
    engines: [], engine_modules: [], engine_actions: [], engine_axes: [],
    concept_blocks: [], proposition_blocks: [], relation_blocks: [],
    motherhoods: [], histories: [], states: [],
  } as unknown as IRContainer;
  return { ...base, ...overrides };
}

describe('OSE 裁决层 (Phase 2.5)', () => {
  it('T1: blockIntegrity 悬空引用 → severity=block_with_fix_hint + fixHint.action=add_declaration', () => {
    const ir = makeIR({
      concept_blocks: [{ id: 'cb1', name: 'X', kind: '', definition: '', scope: '' } as any],
      proposition_blocks: [
        { id: 'p1', name: 'P', subject: '不存在', predicate: '是', object: 'X', assertion: '' } as any,
      ],
    });
    const r = runOSEOnProjection({ ir, manifest: null, frontend: null, backend: null });
    const d = (r.blockIntegrity || []).find(x => x.policyId === 'ose.blockIntegrity.dangling_ref');
    expect(d).toBeDefined();
    expect(d!.severity).toBe('block_with_fix_hint');
    expect(d!.fixHint?.action).toBe('add_declaration');
    expect(d!.fixHint?.target).toBe('不存在');
  });

  it('T2: stageReachability 不可达阶段 → severity=block', () => {
    const ir = makeIR({
      subjects: [{ id: 's1', name: 'S', current_stage: 'A' } as any],
      stages: [
        { id: 'st1', name: 'A', index: 1 } as any,
        { id: 'st2', name: 'B', index: 2 } as any,
        { id: 'st3', name: 'C', index: 3 } as any,
      ],
      transitions: [
        { id: 't1', name: 't_ab', from_stage: 'A', to_stage: 'B', trigger: null } as any,
      ],
    });
    const r = runOSEOnProjection({ ir, manifest: null, frontend: null, backend: null });
    const d = (r.stageReachability || []).find(x => x.policyId === 'ose.stageReachability.unreachable');
    expect(d).toBeDefined();
    expect(d!.severity).toBe('block');
  });

  it('T3: computeBlocked 识别 block + block_with_fix_hint,产出 summary', () => {
    const ir = makeIR({
      concept_blocks: [{ id: 'cb1', name: 'X', kind: '', definition: '', scope: '' } as any],
      relation_blocks: [
        { id: 'r1', name: 'R', source: '未声明', target: 'X', kind: '', strength: 1 } as any,
      ],
    });
    const report = runOSEOnProjection({ ir, manifest: null, frontend: null, backend: null });
    const { blocked, reasons, summary } = computeBlocked(report);
    expect(blocked).toBe(true);
    expect(reasons.length).toBeGreaterThan(0);
    expect(summary.block).toBeGreaterThan(0);
  });

  it('T4: runtime guard - OSE blocked 时 callFunction 拒绝,policyId=runtime.ose.blocked', () => {
    const ir = makeIR();
    const r = guard('callFunction', {
      profile, ir, target: 'any',
      oseVerdict: { blocked: true, reasons: ['测试阻断'], primaryFixHint: '修复测试' },
    });
    expect(r.allowed).toBe(false);
    expect(r.policyId).toBe('runtime.ose.blocked');
    expect(r.severity).toBe('block');
  });

  it('T5: runtime guard - OSE blocked 时 validate 仍放行(读路径不拦)', () => {
    const ir = makeIR();
    const r = guard('validate', {
      profile, ir,
      oseVerdict: { blocked: true, reasons: ['x'] },
    });
    expect(r.allowed).toBe(true);
  });

  it('T6: 幂等性 - 同一 IR 反复裁决结果稳定', () => {
    const ir = makeIR({
      mapping_tables: [{ id: 'mt1', name: 'M', columns: [], rows: [], aligned: true, misaligned_rows: [] } as any],
    });
    const r1 = runOSEOnProjection({ ir, manifest: null, frontend: null, backend: null });
    const r2 = runOSEOnProjection({ ir, manifest: null, frontend: null, backend: null });
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});
