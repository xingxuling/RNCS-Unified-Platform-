// P1: IR._meta 完整性回归测试
import { describe, it, expect } from 'vitest';
import { runCSL } from '@/csl/versions/dispatch';
import { checkIRMetaCompleteness, assertIRMetaComplete } from '@/csl/ir-builder/meta-assert';
import type { IRContainer } from '@/csl/types';

const SAMPLE = `概念 学生 { 属性 名字: 文本 }\n实例 张三 属于 学生 { 名字 = "张三" }`;

describe('IR _meta 完整性 (P1)', () => {
  it('正常 buildIR 后 _meta 7 项核心字段齐全', () => {
    const r = runCSL(SAMPLE, 'v0.9');
    expect(r.error).toBeNull();
    expect(r.ir).toBeTruthy();
    const meta = r.ir!._meta!;
    expect(meta.profileId).toBeTruthy();
    expect(meta.grammarVersion).toBe('v0.9');
    expect(meta.specVersion).toBeTruthy();
    expect(meta.compilerVersion).toBeTruthy();
    expect(meta.osePolicyVersion).toBeTruthy();
    expect(typeof meta.featureFlags).toBe('object');
    expect(Array.isArray(meta.enabledModes)).toBe(true);
    expect(meta.osePolicySet).toBeTruthy();
  });

  it('checkIRMetaCompleteness 对完整 IR 返回 ok=true', () => {
    const r = runCSL(SAMPLE, 'v0.8');
    const c = checkIRMetaCompleteness(r.ir!);
    expect(c.ok).toBe(true);
    expect(c.missing).toEqual([]);
  });

  it('缺 _meta → 检查失败,assert 抛错', () => {
    const ir = {} as IRContainer;
    const c = checkIRMetaCompleteness(ir);
    expect(c.ok).toBe(false);
    expect(c.missing).toContain('_meta');
    expect(() => assertIRMetaComplete(ir)).toThrow(/_meta/);
  });

  it('缺 enabledModes → 检查失败', () => {
    const r = runCSL(SAMPLE, 'v0.9');
    const ir = r.ir!;
    const broken = { ...ir, _meta: { ...ir._meta!, enabledModes: undefined as any } } as IRContainer;
    const c = checkIRMetaCompleteness(broken);
    expect(c.ok).toBe(false);
    expect(c.missing).toContain('enabledModes');
  });

  it('缺 osePolicySet → 检查失败', () => {
    const r = runCSL(SAMPLE, 'v0.9');
    const ir = r.ir!;
    const broken = { ...ir, _meta: { ...ir._meta!, osePolicySet: undefined as any } } as IRContainer;
    expect(checkIRMetaCompleteness(broken).ok).toBe(false);
    expect(() => assertIRMetaComplete(broken)).toThrow(/osePolicySet/);
  });

  it('osePolicySet 缺 blockingHooks → 检查失败', () => {
    const r = runCSL(SAMPLE, 'v0.9');
    const ir = r.ir!;
    const broken = { ...ir, _meta: {
      ...ir._meta!,
      osePolicySet: { version: '1', enabledHooks: [], blockingHooks: undefined as any },
    } } as IRContainer;
    const c = checkIRMetaCompleteness(broken);
    expect(c.ok).toBe(false);
    expect(c.missing).toContain('osePolicySet.blockingHooks');
  });

  it('featureFlags 是空对象 → 视为异常', () => {
    const r = runCSL(SAMPLE, 'v0.9');
    const ir = r.ir!;
    const broken = { ...ir, _meta: { ...ir._meta!, featureFlags: {} } } as IRContainer;
    expect(checkIRMetaCompleteness(broken).ok).toBe(false);
  });
});
