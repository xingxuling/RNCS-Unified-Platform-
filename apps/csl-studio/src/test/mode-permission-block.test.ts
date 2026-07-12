// P5-2 回归:blocked_by_mode_or_permission 真实触发路径
//
// 覆盖三条真实路径:
//   1. lockState=read_only  → 整轮 governance_blocked + candidate.verdict
//   2. lockState=incompatible → 同上,policyId 不同
//   3. profile.enabledModes 不含 'stage' → mode.stage_disabled
//
// 不构造假诊断,所有 verdict 来自真实 stage-engine 计算。

import { describe, it, expect } from 'vitest';
import { getCapabilityProfile } from '@/csl';
import { advanceAllSubjects } from '@/csl/stage-engine';
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

describe('P5-2: blocked_by_mode_or_permission 真实触发', () => {
  it('lockState=read_only → 整轮 governance_blocked + candidate verdict 标注', () => {
    const ir = makeIR();
    const profile = getCapabilityProfile('v0.9');
    const adv = advanceAllSubjects(ir, profile, undefined, undefined, { lockState: 'read_only' });
    expect(adv[0].halt_reason).toBe('governance_blocked');
    expect(adv[0].governance[0].policyId).toBe('permission.lockState.read_only');
    // candidate 也应被标注
    const cand = adv[0].candidates[0];
    expect(cand.verdict).toBe('blocked_by_mode_or_permission');
    expect(cand.blockedBy?.policyId).toBe('permission.lockState.read_only');
    expect(cand.blockedBy?.fixHint).toBeTruthy();
  });

  it('lockState=incompatible → policyId=incompatible', () => {
    const ir = makeIR();
    const profile = getCapabilityProfile('v0.9');
    const adv = advanceAllSubjects(ir, profile, undefined, undefined, { lockState: 'incompatible' });
    expect(adv[0].halt_reason).toBe('governance_blocked');
    expect(adv[0].governance[0].policyId).toBe('permission.lockState.incompatible');
    expect(adv[0].candidates[0].verdict).toBe('blocked_by_mode_or_permission');
  });

  it('profile.enabledModes 不含 stage → mode.stage_disabled', () => {
    const ir = makeIR();
    const profile = getCapabilityProfile('v0.9');
    // 构造一个"不含 stage"的 profile(模拟 spec 关闭 subjects/sovereignty_stages)
    const fakeProfile = { ...profile, enabledModes: profile.enabledModes.filter(m => m !== 'stage') };
    const adv = advanceAllSubjects(ir, fakeProfile, undefined, undefined, { lockState: 'editable' });
    expect(adv[0].halt_reason).toBe('governance_blocked');
    expect(adv[0].governance[0].policyId).toBe('permission.mode.stage_disabled');
    expect(adv[0].candidates[0].verdict).toBe('blocked_by_mode_or_permission');
  });

  it('lockState=editable + 正常 profile → 不触发 mode/permission 阻断', () => {
    const ir = makeIR();
    const profile = getCapabilityProfile('v0.9');
    const adv = advanceAllSubjects(ir, profile, undefined, undefined, { lockState: 'editable' });
    expect(adv[0].halt_reason).not.toBe('governance_blocked');
    expect(adv[0].candidates[0].verdict).not.toBe('blocked_by_mode_or_permission');
  });
});
