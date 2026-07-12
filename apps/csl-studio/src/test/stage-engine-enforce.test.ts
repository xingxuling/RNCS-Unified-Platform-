// P2 回归:stage-engine 接 RuntimeGuard
// 直接构造最小 IR 验证 governance 行为,避开 v0.9 语法解析细节

import { describe, it, expect } from 'vitest';
import { getCapabilityProfile } from '@/csl';
import { advanceAllSubjects } from '@/csl/stage-engine';
import type { OSEVerdict } from '@/csl';
import type { IRContainer } from '@/csl';

function makeIR(): IRContainer {
  return {
    concepts: [], entities: [], attributes: [], invariants: [], rules: [], evidences: [],
    functions: [],
    subjects: [{ id: 'S1', name: '张三', current_stage: '醒', attributes: { 力量: 5 } }],
    stages: [{ id: 'ST1', name: '醒' }, { id: 'ST2', name: '战' }],
    transitions: [{
      id: 'T1', name: '出征', from_stage: '醒', to_stage: '战',
      trigger: { left: '力量', op: 'gt', right: 0 },
    }],
    signals: [], regenerations: [], compiler_layers: [],
  } as unknown as IRContainer;
}

describe('P2: stage-engine 治理接入', () => {
  it('profile 关闭 stage_transitions → governance_blocked', () => {
    const ir = makeIR();
    const profile = getCapabilityProfile('v0.9');
    const fakeProfile = {
      ...profile,
      runtimePermissions: { ...profile.runtimePermissions, allowStageTransition: false },
    };
    const adv = advanceAllSubjects(ir, fakeProfile);
    expect(adv[0].halt_reason).toBe('governance_blocked');
    expect(adv[0].governance.length).toBeGreaterThan(0);
    expect(adv[0].governance[0].policyId).toContain('stage_transitions');
  });

  it('oseVerdict.blocked=true → governance_blocked', () => {
    const ir = makeIR();
    const profile = getCapabilityProfile('v0.9');
    const verdict: OSEVerdict = { blocked: true, reasons: ['mock'], primaryFixHint: 'fix' };
    const adv = advanceAllSubjects(ir, profile, verdict);
    expect(adv[0].halt_reason).toBe('governance_blocked');
    expect(adv[0].governance[0].policyId).toBe('runtime.ose.blocked');
  });

  it('缺 profile → bypass 警告但不阻断', () => {
    const ir = makeIR();
    const adv = advanceAllSubjects(ir);
    expect(adv[0].governance.some(g => g.policyId === 'runtime.guard.bypassed')).toBe(true);
    expect(adv[0].halt_reason).not.toBe('governance_blocked');
  });

  it('正常 profile + 无 OSE block → 推进正常', () => {
    const ir = makeIR();
    const profile = getCapabilityProfile('v0.9');
    const adv = advanceAllSubjects(ir, profile);
    expect(adv[0].halt_reason).not.toBe('governance_blocked');
    expect(adv[0].governance.length).toBe(0);
  });
});
