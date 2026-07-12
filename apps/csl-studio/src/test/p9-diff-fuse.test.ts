// P9 — diff fuse 双向合并测试
// 升级要求:del→add 与 add→del 两种顺序都应被融合为 mod。

import { describe, it, expect } from 'vitest';
import { diffLines } from '@/csl/ui/source-diff';

describe('P9 — diffLines 双向 fuse', () => {
  it('单行修改在两种 LCS 回溯顺序下都会被合并为 mod', () => {
    // 强制构造一个 LCS 必然产生 mod 的场景:首尾相同,中间不同
    const { lines, summary } = diffLines('head\nold\ntail', 'head\nnew\ntail');
    expect(summary.mod).toBe(1);
    expect(summary.add).toBe(0);
    expect(summary.del).toBe(0);
    const mod = lines.find(l => l.op === 'mod');
    expect(mod).toBeDefined();
    expect(mod!.aText).toBe('old');
    expect(mod!.bText).toBe('new');
  });

  it('多处分散的修改:每处都是 mod,统计精确不重复', () => {
    const a = 'k1\nA\nk2\nB\nk3';
    const b = 'k1\nA2\nk2\nB2\nk3';
    const { summary } = diffLines(a, b);
    expect(summary.mod).toBe(2);
    expect(summary.same).toBe(3);
    expect(summary.add).toBe(0);
    expect(summary.del).toBe(0);
  });

  it('纯新增不应被错误融合为 mod', () => {
    const { summary } = diffLines('a\nb', 'a\nb\nc');
    expect(summary.mod).toBe(0);
    expect(summary.add).toBe(1);
    expect(summary.del).toBe(0);
  });

  it('纯删除不应被错误融合为 mod', () => {
    const { summary } = diffLines('a\nb\nc', 'a\nb');
    expect(summary.mod).toBe(0);
    expect(summary.add).toBe(0);
    expect(summary.del).toBe(1);
  });

  it('add 与 del 中间隔了 same 时不融合', () => {
    // a 比 b 多一行 X,b 比 a 多一行 Y,中间隔着相同行 → 不应错误合并
    const a = 'X\nshared\n';
    const b = 'shared\nY\n';
    const { summary } = diffLines(a, b);
    // 不应该出现 mod
    expect(summary.mod).toBe(0);
    expect(summary.add + summary.del).toBeGreaterThanOrEqual(2);
  });

  it('summary.add+del+mod+same = max(totalA, totalB) 的合理上界', () => {
    const { summary } = diffLines('a\nb\nc\nd', 'a\nB\nc\nD');
    const total = summary.add + summary.del + summary.mod + summary.same;
    // mod 计 1 行,所以 total = same(2) + mod(2) = 4
    expect(total).toBe(4);
    expect(summary.mod).toBe(2);
  });
});
