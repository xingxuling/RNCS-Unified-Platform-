// P1: spec-driven blockingHooks 回归测试
// 治理级别(severity) 的定义权必须在规格层(ose-protocol),不在代码常量。
// 改 spec 的 hook severity → blockingHooks 集合变化 → OSE 判定结果变化。
import { describe, it, expect } from 'vitest';
import { compileCapabilityProfile } from '@/csl/capability/profile';
import type { OSEHookSpec, SpecRegistry } from '@/csl/specs/loader';

function makeSpec(hooks: Partial<OSEHookSpec>[]): SpecRegistry {
  return {
    versions: [], features: [],
    astNodes: [], irTypes: [], examples: [], projectionDemos: [],
    suffixes: [], platforms: [], buildSteps: [],
    oseHooks: hooks.map((h, i): OSEHookSpec => ({
      id: h.id || `hook_${i}`,
      aspect: h.aspect || 'misc',
      phase: h.phase || 'P1',
      status: h.status || 'active',
      entryPoint: h.entryPoint || 'noop',
      severity: h.severity || 'warn',
      description: h.description || '',
    })),
    diagnostics: [], rawIRs: {} as any, rawSources: {} as any,
  };
}

describe('Spec-driven blockingHooks (P1)', () => {
  it('全部 warn → blockingHooks 为空', () => {
    const profile = compileCapabilityProfile('v0.9', makeSpec([
      { id: 'h1', severity: 'warn' },
      { id: 'h2', severity: 'warn' },
    ]));
    expect(profile.osePolicies.blockingHooks.length).toBe(0);
    expect([...profile.osePolicies.warnOnlyHooks].sort()).toEqual(['h1', 'h2']);
  });

  it('把 h1 升为 block → blockingHooks 包含 h1', () => {
    const profile = compileCapabilityProfile('v0.9', makeSpec([
      { id: 'h1', severity: 'block' },
      { id: 'h2', severity: 'warn' },
    ]));
    expect(profile.osePolicies.blockingHooks).toContain('h1');
    expect(profile.osePolicies.blockingHooks).not.toContain('h2');
    expect(profile.osePolicies.warnOnlyHooks).toContain('h2');
  });

  it('block_with_fix_hint 也算 blocking', () => {
    const profile = compileCapabilityProfile('v0.9', makeSpec([
      { id: 'h1', severity: 'block_with_fix_hint' },
    ]));
    expect(profile.osePolicies.blockingHooks).toContain('h1');
  });

  it('status=planned 的 hook 不进入 enabledHooks', () => {
    const profile = compileCapabilityProfile('v0.9', makeSpec([
      { id: 'h_active', severity: 'block', status: 'active' },
      { id: 'h_planned', severity: 'block', status: 'planned' },
    ]));
    expect(profile.osePolicies.enabledHooks).toContain('h_active');
    expect(profile.osePolicies.enabledHooks).not.toContain('h_planned');
    expect(profile.osePolicies.blockingHooks).not.toContain('h_planned');
  });

  it('回归:同一份 spec 编译两次 profile → blockingHooks 完全一致', () => {
    const spec = makeSpec([
      { id: 'a', severity: 'block' },
      { id: 'b', severity: 'warn' },
      { id: 'c', severity: 'block_with_fix_hint' },
    ]);
    const p1 = compileCapabilityProfile('v0.9', spec);
    const p2 = compileCapabilityProfile('v0.9', spec);
    expect(p1.osePolicies.blockingHooks.slice().sort())
      .toEqual(p2.osePolicies.blockingHooks.slice().sort());
  });

  it('治理主权属于 spec — 把 block 改回 warn 后 blockingHooks 立即变化', () => {
    const before = compileCapabilityProfile('v0.9', makeSpec([{ id: 'x', severity: 'block' }]));
    const after = compileCapabilityProfile('v0.9', makeSpec([{ id: 'x', severity: 'warn' }]));
    expect(before.osePolicies.blockingHooks).toContain('x');
    expect(after.osePolicies.blockingHooks).not.toContain('x');
    // profile.id 也必须随之变化(指纹敏感)
    expect(before.id).not.toEqual(after.id);
  });
});
