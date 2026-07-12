// P8 — 最小源码级 diff
// 故意只做行级 LCS 起步,不做 token-level / merge-editor 等复杂特性。
// 用法:diffLines(a, b) → 行操作序列,可直接渲染为「+/- /context」三态视图。

export type LineOp = 'same' | 'add' | 'del' | 'mod';

export interface DiffLine {
  op: LineOp;
  /** source 侧行号(1-based,add 时为 null) */
  aLine: number | null;
  /** target 侧行号(1-based,del 时为 null) */
  bLine: number | null;
  /** 显示用文本(mod 时合并 a/b,见 aText/bText) */
  text?: string;
  aText?: string;
  bText?: string;
}

export interface DiffSummary {
  same: number;
  add: number;
  del: number;
  mod: number;
  totalA: number;
  totalB: number;
}

/** 经典 LCS,O(n·m)。CSL 源码通常 ≤ 数百行,完全够用。 */
function lcsTable(a: string[], b: string[]): number[][] {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

/** 把相邻 add+del / del+add 合并成 mod,提升可读性。
 *  P9:LCS 回溯方向不固定,两种顺序都可能产生,需双向融合。
 *  规则:仅当两条相邻、一条 del 一条 add 时才合并;same 阻断融合。 */
function fuseModifications(ops: DiffLine[]): DiffLine[] {
  const out: DiffLine[] = [];
  for (let i = 0; i < ops.length; i++) {
    const cur = ops[i];
    const next = ops[i + 1];
    if (next && (
      (cur.op === 'del' && next.op === 'add') ||
      (cur.op === 'add' && next.op === 'del')
    )) {
      const delOp = cur.op === 'del' ? cur : next;
      const addOp = cur.op === 'add' ? cur : next;
      out.push({
        op: 'mod',
        aLine: delOp.aLine,
        bLine: addOp.bLine,
        aText: delOp.text,
        bText: addOp.text,
      });
      i++; // skip next
    } else {
      out.push(cur);
    }
  }
  return out;
}

export function diffLines(srcA: string, srcB: string): { lines: DiffLine[]; summary: DiffSummary } {
  const a = srcA.split(/\r?\n/);
  const b = srcB.split(/\r?\n/);
  const dp = lcsTable(a, b);
  const out: DiffLine[] = [];
  let i = a.length, j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.push({ op: 'same', aLine: i, bLine: j, text: a[i - 1] });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      out.push({ op: 'del', aLine: i, bLine: null, text: a[i - 1] });
      i--;
    } else {
      out.push({ op: 'add', aLine: null, bLine: j, text: b[j - 1] });
      j--;
    }
  }
  while (i > 0) { out.push({ op: 'del', aLine: i, bLine: null, text: a[i - 1] }); i--; }
  while (j > 0) { out.push({ op: 'add', aLine: null, bLine: j, text: b[j - 1] }); j--; }
  out.reverse();
  const fused = fuseModifications(out);
  const summary: DiffSummary = {
    same: fused.filter(l => l.op === 'same').length,
    add:  fused.filter(l => l.op === 'add').length,
    del:  fused.filter(l => l.op === 'del').length,
    mod:  fused.filter(l => l.op === 'mod').length,
    totalA: a.length,
    totalB: b.length,
  };
  return { lines: fused, summary };
}
