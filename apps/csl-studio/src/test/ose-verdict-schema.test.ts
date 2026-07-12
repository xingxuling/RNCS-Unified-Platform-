// P1: OSEVerdict schema 跨层一致性测试
// 防止未来再次出现 "UI blocked 但 runtime 不拦" 的退化
import { describe, it, expect } from 'vitest';
import { validateOSEVerdict, assertOSEVerdict } from '@/csl/runtime/ose-verdict-schema';
import { runCSL } from '@/csl/versions/dispatch';
import { runOSEOnProjection, computeBlocked } from '@/csl/projection/ose-bridge';
import { guard } from '@/csl/runtime/guard';
import { getCapabilityProfile } from '@/csl/capability';
import type { OSEVerdict } from '@/csl/runtime/guard';

describe('OSEVerdict schema (P1)', () => {
  it('合法 verdict 通过校验', () => {
    const v: OSEVerdict = { blocked: false, reasons: [] };
    expect(validateOSEVerdict(v).ok).toBe(true);
  });

  it('blocked=true 但 reasons 空 → 失败', () => {
    const r = validateOSEVerdict({ blocked: true, reasons: [] });
    expect(r.ok).toBe(false);
    expect(r.issues.some(i => i.field === 'reasons')).toBe(true);
  });

  it('reasons 非数组 → 失败', () => {
    const r = validateOSEVerdict({ blocked: false, reasons: 'oops' });
    expect(r.ok).toBe(false);
  });

  it('blocked 缺失 → 失败', () => {
    const r = validateOSEVerdict({ reasons: [] });
    expect(r.ok).toBe(false);
    expect(r.issues.some(i => i.field === 'blocked')).toBe(true);
  });

  it('primaryFixHint 类型错误 → 失败', () => {
    const r = validateOSEVerdict({ blocked: false, reasons: [], primaryFixHint: 123 });
    expect(r.ok).toBe(false);
  });

  it('assertOSEVerdict 在错误形状时抛错', () => {
    expect(() => assertOSEVerdict({ blocked: 'yes', reasons: [] })).toThrow(/OSEVerdict/);
  });

  // 跨层一致性:runtime 路径产出的 verdict 与 projection 路径独立产出的 verdict 必须 schema 等价
  it('runtime 与 projection 各自构造的 verdict 同 schema', () => {
    const src = `概念 X { 属性 a: 文本 }\n实例 i 属于 X { a = "1" }`;
    const r = runCSL(src, 'v0.8');
    expect(r.error).toBeNull();
    expect(r.oseVerdict).toBeDefined();
    expect(validateOSEVerdict(r.oseVerdict!).ok).toBe(true);

    // 同一份 IR 单独走 projection OSE
    const report = runOSEOnProjection({ ir: r.ir!, manifest: null, frontend: null, backend: null });
    const v = computeBlocked(report);
    const v2: OSEVerdict = { blocked: v.blocked, reasons: v.reasons, primaryFixHint: v.reasons[0] };
    expect(validateOSEVerdict(v2).ok).toBe(true);

    // 两路 verdict 的 blocked 字段必须一致
    expect(r.oseVerdict!.blocked).toBe(v2.blocked);
  });

  it('guard 接受合法 verdict 后能正确拦 callFunction', () => {
    const profile = getCapabilityProfile('v0.9');
    const verdict: OSEVerdict = { blocked: true, reasons: ['模拟阻断'], primaryFixHint: '修一下' };
    assertOSEVerdict(verdict);
    const res = guard('callFunction', { profile, target: 'f', oseVerdict: verdict });
    expect(res.allowed).toBe(false);
    expect(res.policyId).toBe('runtime.ose.blocked');
  });
});
