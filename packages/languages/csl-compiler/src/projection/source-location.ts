// CSL P4/P5 — 诊断源码定位反查
//
// P5 升级:递归全量下钻,覆盖深层 body/then_branch/else_branch/clauses/parts 等任意子节点。
// 失败安全:任何节点找不到都跳过,不抛异常,不破坏诊断本身。

import type { ProgramNode, ASTNode, SourceSpan } from '../types';
import type { ProjectionDiagnostic, SourceLocation } from './types';
import type { OSEReport } from './ose-bridge';

interface NamedAstNode extends ASTNode {
  name?: string;
}

/** 判断对象是否为 AST 节点(具有 string 类型的 type 字段) */
function isAstNode(v: unknown): v is ASTNode {
  return !!v && typeof v === 'object' && typeof (v as { type?: unknown }).type === 'string';
}

/**
 * 从 Program 全量递归抽出 (name → source_span) 索引。
 * P5:不再只下钻 body —— 任意属性为 AST 节点 / AST 节点数组的字段都会被访问。
 * 这覆盖:函数体 body / IfExpr.then_branch / else_branch / else_if_branches[].body /
 *        概念块 body / 命题块 / 关系块 / 规则 conditions+actions / 不变量 clauses 等。
 */
export function buildAstNameIndex(ast: ProgramNode | null): Map<string, SourceSpan> {
  const idx = new Map<string, SourceSpan>();
  if (!ast) return idx;

  const seen = new WeakSet<object>();
  const visit = (node: unknown): void => {
    if (!isAstNode(node)) return;
    if (seen.has(node as object)) return;
    seen.add(node as object);

    const named = node as NamedAstNode;
    if (named.name && typeof named.name === 'string' && node.source_span && !idx.has(named.name)) {
      idx.set(named.name, node.source_span);
    }
    // 递归任意子字段
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'source_span' || key === 'name') continue;
      const v = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(v)) {
        for (const item of v) visit(item);
      } else if (v && typeof v === 'object') {
        visit(v);
      }
    }
  };
  ast.body.forEach(visit);
  return idx;
}

/** 从源码字符串里安全截取一段(去前后空白,限长) */
function snippetFromSource(source: string, span: SourceSpan): string {
  const lines = source.split('\n');
  const lineIdx = Math.max(0, span.line_start - 1);
  if (lineIdx >= lines.length) return '';
  const raw = lines[lineIdx].trim();
  if (raw.length <= 80) return raw;
  return raw.slice(0, 77) + '...';
}

/** 计算列号(1-based):取该行第一个非空白字符位置 */
function columnFromSource(source: string, line: number): number | undefined {
  const lines = source.split('\n');
  const idx = line - 1;
  if (idx < 0 || idx >= lines.length) return undefined;
  const m = lines[idx].match(/\S/);
  return m && m.index !== undefined ? m.index + 1 : 1;
}

/** 给单条诊断附加 sourceLocation;若无 nodeRef 或反查失败则原样返回 */
export function attachSourceLocation(
  diag: ProjectionDiagnostic,
  index: Map<string, SourceSpan>,
  source: string,
): ProjectionDiagnostic {
  if (diag.sourceLocation) return diag;
  const ref = diag.nodeRef;
  if (!ref) return diag;
  const span = index.get(ref);
  if (!span) return diag;
  const loc: SourceLocation = {
    line: span.line_start,
    lineEnd: span.line_end,
    column: columnFromSource(source, span.line_start),
    snippet: snippetFromSource(source, span),
  };
  return { ...diag, sourceLocation: loc };
}

/** 给整份 OSEReport 的所有诊断批量注入 sourceLocation */
export function annotateOSEReportWithSource(
  report: OSEReport,
  ast: ProgramNode | null,
  source: string,
): OSEReport {
  const idx = buildAstNameIndex(ast);
  const out: Record<string, ProjectionDiagnostic[]> = {};
  for (const [bucket, list] of Object.entries(report)) {
    if (!Array.isArray(list)) continue;
    out[bucket] = list.map(d => attachSourceLocation(d, idx, source));
  }
  return out as unknown as OSEReport;
}
