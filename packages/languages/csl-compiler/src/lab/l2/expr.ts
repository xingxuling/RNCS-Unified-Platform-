// L2 影子分支 — 约束表达式最小子集 (P14)
//
// 设计纪律:
//   - 仅供 inspect / Viewer / Compare / OSE 解释 constraint.expr,不参与 runtime
//   - 失败不抛错,只把诊断挂到 parse 结果上;原始字符串永远保留
//   - 最小子集:literal / identifier / member path / call / 比较 / and/or
//   - 第一轮不支持:括号优先级覆盖、unary、算术、字符串模板、链式调用之外的复杂调用

export type L2ExprNode =
  | { kind: 'lit'; value: string | number | boolean; raw: string }
  | { kind: 'ident'; name: string }
  | { kind: 'member'; path: string[] } // a.b.c
  | { kind: 'call'; callee: string[]; args: L2ExprNode[] }
  | { kind: 'cmp'; op: '==' | '!=' | '>' | '<' | '>=' | '<='; left: L2ExprNode; right: L2ExprNode }
  | { kind: 'logic'; op: 'and' | 'or'; left: L2ExprNode; right: L2ExprNode };

export interface L2ExprDiagnostic {
  level: 'warn' | 'info';
  code: string;
  message: string;
}

export interface L2ExprParseResult {
  ok: boolean;
  ast?: L2ExprNode;
  raw: string;
  diagnostics: L2ExprDiagnostic[];
}

// ---------- Tokenizer ----------

type Tok =
  | { t: 'num'; v: number; raw: string }
  | { t: 'str'; v: string; raw: string }
  | { t: 'bool'; v: boolean; raw: string }
  | { t: 'ident'; v: string }
  | { t: 'kw'; v: 'and' | 'or' }
  | { t: 'punct'; v: '(' | ')' | ',' | '.' }
  | { t: 'op'; v: '==' | '!=' | '>=' | '<=' | '>' | '<' };

function tokenize(input: string): { toks: Tok[]; diag: L2ExprDiagnostic[] } {
  const toks: Tok[] = [];
  const diag: L2ExprDiagnostic[] = [];
  let i = 0;
  const s = input;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    // strings
    if (c === '"' || c === "'") {
      const quote = c; let j = i + 1; let v = '';
      while (j < s.length && s[j] !== quote) { v += s[j]; j++; }
      if (j >= s.length) {
        diag.push({ level: 'warn', code: 'L2_EXPR_UNCLOSED_STRING', message: '字符串字面量未闭合' });
        return { toks, diag };
      }
      toks.push({ t: 'str', v, raw: s.slice(i, j + 1) });
      i = j + 1; continue;
    }
    // numbers
    if (/[0-9]/.test(c)) {
      let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const raw = s.slice(i, j);
      const n = Number(raw);
      if (Number.isNaN(n)) {
        diag.push({ level: 'warn', code: 'L2_EXPR_BAD_NUMBER', message: `不合法的数字字面量:${raw}` });
        return { toks, diag };
      }
      toks.push({ t: 'num', v: n, raw }); i = j; continue;
    }
    // operators
    if (c === '=' && s[i + 1] === '=') { toks.push({ t: 'op', v: '==' }); i += 2; continue; }
    if (c === '!' && s[i + 1] === '=') { toks.push({ t: 'op', v: '!=' }); i += 2; continue; }
    if (c === '>' && s[i + 1] === '=') { toks.push({ t: 'op', v: '>=' }); i += 2; continue; }
    if (c === '<' && s[i + 1] === '=') { toks.push({ t: 'op', v: '<=' }); i += 2; continue; }
    if (c === '>') { toks.push({ t: 'op', v: '>' }); i++; continue; }
    if (c === '<') { toks.push({ t: 'op', v: '<' }); i++; continue; }
    if (c === '(' || c === ')' || c === ',' || c === '.') {
      toks.push({ t: 'punct', v: c as '(' | ')' | ',' | '.' }); i++; continue;
    }
    // identifier / keyword / bool
    if (/[A-Za-z_\u4e00-\u9fa5$]/.test(c)) {
      let j = i; while (j < s.length && /[A-Za-z0-9_\u4e00-\u9fa5$]/.test(s[j])) j++;
      const id = s.slice(i, j); i = j;
      if (id === 'and' || id === 'or') toks.push({ t: 'kw', v: id });
      else if (id === 'true') toks.push({ t: 'bool', v: true, raw: id });
      else if (id === 'false') toks.push({ t: 'bool', v: false, raw: id });
      else toks.push({ t: 'ident', v: id });
      continue;
    }
    diag.push({ level: 'warn', code: 'L2_EXPR_UNEXPECTED_CHAR', message: `表达式中无法识别的字符:${c}` });
    return { toks, diag };
  }
  return { toks, diag };
}

// ---------- Parser (recursive descent, no paren) ----------
// 优先级: logic(or > and 由左结合简化) > cmp > primary
// 第一轮不引入括号优先级;以从左到右线性消费简化实现。

function parseExpr(toks: Tok[]): { node: L2ExprNode; rest: Tok[]; diag: L2ExprDiagnostic[] } | null {
  const diag: L2ExprDiagnostic[] = [];
  const cmp = parseCmp(toks);
  if (!cmp) return null;
  let cur = cmp.node; let rest = cmp.rest; diag.push(...cmp.diag);
  while (rest.length && rest[0].t === 'kw') {
    const op = (rest[0] as { t: 'kw'; v: 'and' | 'or' }).v;
    rest = rest.slice(1);
    const right = parseCmp(rest);
    if (!right) {
      diag.push({ level: 'warn', code: 'L2_EXPR_LOGIC_RHS_MISSING', message: `逻辑运算符 ${op} 缺右值` });
      return null;
    }
    cur = { kind: 'logic', op, left: cur, right: right.node };
    rest = right.rest; diag.push(...right.diag);
  }
  return { node: cur, rest, diag };
}

function parseCmp(toks: Tok[]): { node: L2ExprNode; rest: Tok[]; diag: L2ExprDiagnostic[] } | null {
  const diag: L2ExprDiagnostic[] = [];
  const left = parsePrimary(toks);
  if (!left) return null;
  let cur = left.node; let rest = left.rest;
  if (rest.length && rest[0].t === 'op') {
    const op = (rest[0] as { t: 'op'; v: '==' | '!=' | '>' | '<' | '>=' | '<=' }).v;
    rest = rest.slice(1);
    const right = parsePrimary(rest);
    if (!right) {
      diag.push({ level: 'warn', code: 'L2_EXPR_CMP_RHS_MISSING', message: `比较运算符 ${op} 缺右值` });
      return null;
    }
    cur = { kind: 'cmp', op, left: cur, right: right.node };
    rest = right.rest;
  }
  return { node: cur, rest, diag };
}

function parsePrimary(toks: Tok[]): { node: L2ExprNode; rest: Tok[] } | null {
  if (!toks.length) return null;
  const h = toks[0];
  if (h.t === 'str') return { node: { kind: 'lit', value: h.v, raw: h.raw }, rest: toks.slice(1) };
  if (h.t === 'num') return { node: { kind: 'lit', value: h.v, raw: h.raw }, rest: toks.slice(1) };
  if (h.t === 'bool') return { node: { kind: 'lit', value: h.v, raw: h.raw }, rest: toks.slice(1) };
  if (h.t === 'ident') {
    // 收集 path: a.b.c
    const path: string[] = [h.v];
    let i = 1;
    while (i + 1 < toks.length && toks[i].t === 'punct' && (toks[i] as { v: string }).v === '.' && toks[i + 1].t === 'ident') {
      path.push((toks[i + 1] as { t: 'ident'; v: string }).v);
      i += 2;
    }
    // 调用?
    if (i < toks.length && toks[i].t === 'punct' && (toks[i] as { v: string }).v === '(') {
      i++;
      const args: L2ExprNode[] = [];
      let rest = toks.slice(i);
      if (!(rest[0]?.t === 'punct' && (rest[0] as { v: string }).v === ')')) {
        while (true) {
          const a = parseExpr(rest);
          if (!a) return null;
          args.push(a.node);
          rest = a.rest;
          if (rest[0]?.t === 'punct' && (rest[0] as { v: string }).v === ',') {
            rest = rest.slice(1); continue;
          }
          break;
        }
      }
      if (!(rest[0]?.t === 'punct' && (rest[0] as { v: string }).v === ')')) return null;
      rest = rest.slice(1);
      return { node: { kind: 'call', callee: path, args }, rest };
    }
    if (path.length === 1) return { node: { kind: 'ident', name: path[0] }, rest: toks.slice(i) };
    return { node: { kind: 'member', path }, rest: toks.slice(i) };
  }
  return null;
}

export function parseL2Expr(raw: string): L2ExprParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, raw, diagnostics: [{ level: 'info', code: 'L2_EXPR_EMPTY', message: '空表达式' }] };
  }
  const { toks, diag } = tokenize(trimmed);
  if (diag.some(d => d.level === 'warn')) {
    return { ok: false, raw, diagnostics: diag };
  }
  const r = parseExpr(toks);
  if (!r || r.rest.length > 0) {
    return {
      ok: false, raw,
      diagnostics: [
        ...diag,
        ...(r?.diag ?? []),
        { level: 'info', code: 'L2_EXPR_FALLBACK', message: '表达式未能完全解析,已退回原始字符串' },
      ],
    };
  }
  return { ok: true, ast: r.node, raw, diagnostics: [...diag, ...r.diag] };
}

/** 收集表达式中出现的所有 identifier / member 顶层名 — 用于弱绑定 */
export function collectExprRefs(node: L2ExprNode): string[] {
  const out = new Set<string>();
  const walk = (n: L2ExprNode) => {
    switch (n.kind) {
      case 'ident': out.add(n.name); return;
      case 'member': out.add(n.path[0]); return;
      case 'call': out.add(n.callee[0]); n.args.forEach(walk); return;
      case 'cmp': walk(n.left); walk(n.right); return;
      case 'logic': walk(n.left); walk(n.right); return;
      case 'lit': return;
    }
  };
  walk(node);
  return [...out];
}
