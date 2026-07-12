// L2 影子 parser (P13)
//
// 设计纪律:
//   - 完全独立于 src/csl/lexer.ts / parser.ts
//   - 只识别四类顶层声明,行式语法,缩进表示子项
//   - 第一轮不深表达式解析:约束 expr 整段当字符串
//   - flag 关闭 → 给出明确诊断,不抛错,继续解析其余可解析部分
//
// 语法形态(最小闭环):
//
//   引擎 <Name>:
//     模块 <ModuleName>
//     模块 <ModuleName>
//     职责 <RespName>
//
//   模块 <Name>:
//     前置 <constraintName>
//     后置 <constraintName>
//
//   职责 <Name> 归属 <Owner>
//
//   前置 <Name>: <expr 任意非换行文本>
//   后置 <Name>: <expr 任意非换行文本>

import type {
  L2ConstraintKind,
  L2ConstraintNode,
  L2Diagnostic,
  L2EngineNode,
  L2FeatureFlag,
  L2IR,
  L2ModuleNode,
  L2ParseResult,
  L2Program,
  L2ResponsibilityNode,
  L2SourceSpan,
} from './types';
import { L2_KEYWORD_TO_FLAG, isL2FlagEnabled } from './registry';

interface RawLine {
  raw: string;
  trimmed: string;
  indent: number;
  line: number;
}

function preprocess(input: string): RawLine[] {
  const out: RawLine[] = [];
  const lines = input.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const noComment = raw.replace(/\/\/.*$/, '');
    if (!noComment.trim()) continue;
    const indent = noComment.match(/^[ \t]*/)?.[0].length ?? 0;
    out.push({
      raw,
      trimmed: noComment.trim(),
      indent,
      line: i + 1,
    });
  }
  return out;
}

function span(line: number, col = 1): L2SourceSpan {
  return { line, col };
}

/** 拒绝/警告关键字所属 flag 是否开启 */
function checkFlag(
  enabled: readonly L2FeatureFlag[],
  keyword: string,
  s: L2SourceSpan,
  diags: L2Diagnostic[],
): boolean {
  const flag = L2_KEYWORD_TO_FLAG[keyword];
  if (!flag) return true;
  if (isL2FlagEnabled(enabled, flag)) return true;
  diags.push({
    level: 'error',
    code: 'L2_FLAG_DISABLED',
    message: `L2 关键字「${keyword}」对应的特性「${flag}」未开启`,
    span: s,
  });
  return false;
}

function parseEngineHeader(line: RawLine): { name: string } | null {
  // "引擎 <Name>:"
  const m = line.trimmed.match(/^引擎\s+([^\s:：]+)\s*[:：]?\s*$/);
  return m ? { name: m[1] } : null;
}

function parseModuleHeader(line: RawLine): { name: string } | null {
  const m = line.trimmed.match(/^模块\s+([^\s:：]+)\s*[:：]?\s*$/);
  return m ? { name: m[1] } : null;
}

function parseResponsibilityDecl(line: RawLine): { name: string; owner?: string } | null {
  // "职责 <Name> 归属 <Owner>" 或 "职责 <Name>"
  let m = line.trimmed.match(/^职责\s+([^\s]+)\s+归属\s+([^\s]+)\s*$/);
  if (m) return { name: m[1], owner: m[2] };
  m = line.trimmed.match(/^职责\s+([^\s]+)\s*$/);
  return m ? { name: m[1] } : null;
}

function parseConstraintDecl(line: RawLine): { kind: L2ConstraintKind; name: string; expr: string } | null {
  // "前置 <Name>: <expr>" / "后置 <Name>: <expr>"
  const m = line.trimmed.match(/^(前置|后置)\s+([^\s:：]+)\s*[:：]\s*(.+)$/);
  if (!m) return null;
  return {
    kind: m[1] === '前置' ? 'pre' : 'post',
    name: m[2],
    expr: m[3].trim(),
  };
}

function parseSubItem(line: RawLine): { type: '模块' | '职责' | '前置' | '后置'; name: string } | null {
  const m = line.trimmed.match(/^(模块|职责|前置|后置)\s+([^\s]+)\s*$/);
  if (!m) return null;
  return { type: m[1] as '模块' | '职责' | '前置' | '后置', name: m[2] };
}

export interface L2ParseOptions {
  /** 显式开启的 flag 列表;不传 = 全关 */
  enabled?: L2FeatureFlag[];
}

export function parseL2(input: string, opts: L2ParseOptions = {}): L2ParseResult {
  const enabled = opts.enabled ?? [];
  const diagnostics: L2Diagnostic[] = [];
  const lines = preprocess(input);

  const engines: L2EngineNode[] = [];
  const modules: L2ModuleNode[] = [];
  const responsibilities: L2ResponsibilityNode[] = [];
  const constraints: L2ConstraintNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const s = span(line.line);

    // 引擎
    const eng = parseEngineHeader(line);
    if (eng) {
      if (!checkFlag(enabled, '引擎', s, diagnostics)) { i++; continue; }
      const node: L2EngineNode = {
        kind: 'L2Engine', name: eng.name,
        modules: [], responsibilities: [], span: s,
      };
      i++;
      while (i < lines.length && lines[i].indent > line.indent) {
        const sub = parseSubItem(lines[i]);
        if (sub) {
          if (sub.type === '模块') {
            if (checkFlag(enabled, '模块', span(lines[i].line), diagnostics)) {
              node.modules.push(sub.name);
            }
          } else if (sub.type === '职责') {
            if (checkFlag(enabled, '职责', span(lines[i].line), diagnostics)) {
              node.responsibilities.push(sub.name);
            }
          } else {
            diagnostics.push({
              level: 'warn', code: 'L2_UNEXPECTED_SUB',
              message: `引擎「${eng.name}」下不应直接出现「${sub.type}」`,
              span: span(lines[i].line),
            });
          }
        } else {
          diagnostics.push({
            level: 'warn', code: 'L2_PARSE_SKIP',
            message: `引擎「${eng.name}」体内无法识别的行:${lines[i].trimmed}`,
            span: span(lines[i].line),
          });
        }
        i++;
      }
      engines.push(node);
      continue;
    }

    // 模块
    const mod = parseModuleHeader(line);
    if (mod) {
      if (!checkFlag(enabled, '模块', s, diagnostics)) { i++; continue; }
      const node: L2ModuleNode = {
        kind: 'L2Module', name: mod.name,
        pre: [], post: [], span: s,
      };
      i++;
      while (i < lines.length && lines[i].indent > line.indent) {
        const sub = parseSubItem(lines[i]);
        if (sub && (sub.type === '前置' || sub.type === '后置')) {
          if (checkFlag(enabled, sub.type, span(lines[i].line), diagnostics)) {
            (sub.type === '前置' ? node.pre : node.post).push(sub.name);
          }
        } else if (sub) {
          diagnostics.push({
            level: 'warn', code: 'L2_UNEXPECTED_SUB',
            message: `模块「${mod.name}」下不应出现「${sub.type}」`,
            span: span(lines[i].line),
          });
        } else {
          diagnostics.push({
            level: 'warn', code: 'L2_PARSE_SKIP',
            message: `模块「${mod.name}」体内无法识别的行:${lines[i].trimmed}`,
            span: span(lines[i].line),
          });
        }
        i++;
      }
      modules.push(node);
      continue;
    }

    // 职责声明
    const resp = parseResponsibilityDecl(line);
    if (resp) {
      if (!checkFlag(enabled, '职责', s, diagnostics)) { i++; continue; }
      responsibilities.push({
        kind: 'L2Responsibility', name: resp.name, owner: resp.owner, span: s,
      });
      i++;
      continue;
    }

    // 约束声明
    const c = parseConstraintDecl(line);
    if (c) {
      const kw = c.kind === 'pre' ? '前置' : '后置';
      if (!checkFlag(enabled, kw, s, diagnostics)) { i++; continue; }
      constraints.push({
        kind: 'L2Constraint',
        constraintKind: c.kind,
        name: c.name,
        expr: c.expr,
        span: s,
      });
      i++;
      continue;
    }

    // 完全无法识别 — 跳过并提示
    diagnostics.push({
      level: 'info',
      code: 'L2_UNRECOGNIZED',
      message: `L2 影子分支无法识别的顶层行:${line.trimmed}`,
      span: s,
    });
    i++;
  }

  const program: L2Program = {
    kind: 'L2Program',
    version: 'v0.10-alpha',
    nodes: [...engines, ...modules, ...responsibilities, ...constraints],
  };

  const ir: L2IR = {
    version: 'v0.10-alpha',
    engines: engines.map(e => ({ name: e.name, modules: [...e.modules], responsibilities: [...e.responsibilities] })),
    modules: modules.map(m => ({ name: m.name, pre: [...m.pre], post: [...m.post] })),
    responsibilities: responsibilities.map(r => ({ name: r.name, owner: r.owner })),
    constraints: constraints.map(c => ({ name: c.name, kind: c.constraintKind, expr: c.expr })),
  };

  return { version: 'v0.10-alpha', enabled: [...enabled], program, ir, diagnostics };
}
