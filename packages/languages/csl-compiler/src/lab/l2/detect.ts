// L2 是否疑似存在的轻量探测 (P14)
// 不调用 parseL2;只看源码是否包含 L2 顶层关键字。
// 用于 Viewer / Compare 决定是否显示 L2 面板。

const L2_KEYWORDS_RE = /^[ \t]*(引擎|模块|职责|前置|后置)\s+/m;

export function isLikelyL2Source(src: string | null | undefined): boolean {
  if (!src) return false;
  return L2_KEYWORDS_RE.test(src);
}
