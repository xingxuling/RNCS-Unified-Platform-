import { fnv1a64, type VSRValue } from '../../spec/src/index.js';

export interface VSRExpressionBudget {
  maxAstNodes: number; maxDepth: number; maxSteps: number; maxStringLength: number; maxArrayLength: number;
}
export const DEFAULT_EXPRESSION_BUDGET: VSRExpressionBudget = {
  maxAstNodes: 256, maxDepth: 32, maxSteps: 2048, maxStringLength: 8192, maxArrayLength: 256
};

export interface VSRExpressionContext {
  time: number; frame: number; fps: number;
  vars: Record<string, VSRValue>;
  context: Record<string, VSRValue>;
  input: Record<string, VSRValue>;
  node?: Record<string, VSRValue>;
  seed: number;
  scopeId?: string;
}

type TokenType = 'number' | 'string' | 'identifier' | 'operator' | 'punct' | 'eof';
interface Token { type: TokenType; value: string; pos: number }

type AST =
  | { kind: 'literal'; value: VSRValue }
  | { kind: 'identifier'; name: string }
  | { kind: 'member'; object: AST; property: string }
  | { kind: 'unary'; operator: string; argument: AST }
  | { kind: 'binary'; operator: string; left: AST; right: AST }
  | { kind: 'conditional'; test: AST; consequent: AST; alternate: AST }
  | { kind: 'call'; callee: AST; args: AST[] }
  | { kind: 'array'; elements: AST[] };

export interface ParsedExpression { source: string; ast: AST; dependencies: string[]; nodeCount: number }

class Lexer {
  private index = 0;
  constructor(private readonly source: string) {}
  next(): Token {
    while (/\s/.test(this.source[this.index] ?? '')) this.index++;
    const pos = this.index;
    const ch = this.source[this.index];
    if (ch === undefined) return { type: 'eof', value: '', pos };
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(this.source[this.index + 1] ?? ''))) {
      let value = '';
      while (/[\d.]/.test(this.source[this.index] ?? '')) value += this.source[this.index++];
      if (/[eE]/.test(this.source[this.index] ?? '')) {
        value += this.source[this.index++];
        if (/[+-]/.test(this.source[this.index] ?? '')) value += this.source[this.index++];
        while (/\d/.test(this.source[this.index] ?? '')) value += this.source[this.index++];
      }
      if (!Number.isFinite(Number(value))) throw new Error(`Invalid number at ${pos}.`);
      return { type: 'number', value, pos };
    }
    if (ch === '"' || ch === "'") {
      const quote = ch; this.index++; let value = '';
      while (this.index < this.source.length && this.source[this.index] !== quote) {
        const current = this.source[this.index++];
        if (current === '\\') {
          const escaped = this.source[this.index++];
          const map: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"', "'": "'" };
          value += map[escaped ?? ''] ?? escaped ?? '';
        } else value += current;
      }
      if (this.source[this.index] !== quote) throw new Error(`Unterminated string at ${pos}.`);
      this.index++;
      return { type: 'string', value, pos };
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let value = '';
      while (/[A-Za-z0-9_$]/.test(this.source[this.index] ?? '')) value += this.source[this.index++];
      return { type: 'identifier', value, pos };
    }
    const three = this.source.slice(this.index, this.index + 3);
    const two = this.source.slice(this.index, this.index + 2);
    if (['===', '!=='].includes(three)) { this.index += 3; return { type: 'operator', value: three, pos }; }
    if (['&&', '||', '==', '!=', '<=', '>=', '**'].includes(two)) { this.index += 2; return { type: 'operator', value: two, pos }; }
    if ('+-*/%<>!'.includes(ch)) { this.index++; return { type: 'operator', value: ch, pos }; }
    if ('().,?:[]'.includes(ch)) { this.index++; return { type: 'punct', value: ch, pos }; }
    throw new Error(`Unexpected token '${ch}' at ${pos}.`);
  }
}

const PRECEDENCE: Record<string, number> = {
  '||': 1, '&&': 2, '==': 3, '!=': 3, '===': 3, '!==': 3,
  '<': 4, '<=': 4, '>': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6, '**': 7
};

class Parser {
  private lexer: Lexer;
  private current: Token;
  private nodeCount = 0;
  constructor(private readonly source: string, private readonly budget: VSRExpressionBudget) {
    this.lexer = new Lexer(source); this.current = this.lexer.next();
  }
  parse(): ParsedExpression {
    if (this.source.length > this.budget.maxStringLength) throw new Error('Expression exceeds maximum length.');
    const ast = this.parseExpression(0, 0);
    if (this.current.type !== 'eof') throw new Error(`Unexpected token '${this.current.value}' at ${this.current.pos}.`);
    const deps = new Set<string>(); collectDependencies(ast, deps);
    return { source: this.source, ast, dependencies: [...deps].sort(), nodeCount: this.nodeCount };
  }
  private add<T extends AST>(node: T, depth: number): T {
    this.nodeCount++;
    if (this.nodeCount > this.budget.maxAstNodes) throw new Error('Expression exceeds AST node budget.');
    if (depth > this.budget.maxDepth) throw new Error('Expression exceeds depth budget.');
    return node;
  }
  private consume(value?: string): Token {
    const token = this.current;
    if (value !== undefined && token.value !== value) throw new Error(`Expected '${value}' at ${token.pos}.`);
    this.current = this.lexer.next(); return token;
  }
  private parseExpression(minPrecedence: number, depth: number): AST {
    let left = this.parsePrefix(depth + 1);
    left = this.parsePostfix(left, depth + 1);
    while (this.current.type === 'operator') {
      const precedence = PRECEDENCE[this.current.value];
      if (precedence === undefined || precedence < minPrecedence) break;
      const operator = this.consume().value;
      const nextMin = operator === '**' ? precedence : precedence + 1;
      const right = this.parseExpression(nextMin, depth + 1);
      left = this.add({ kind: 'binary', operator, left, right }, depth);
    }
    if (minPrecedence === 0 && this.current.value === '?') {
      this.consume('?'); const consequent = this.parseExpression(0, depth + 1); this.consume(':');
      const alternate = this.parseExpression(0, depth + 1);
      left = this.add({ kind: 'conditional', test: left, consequent, alternate }, depth);
    }
    return left;
  }
  private parsePrefix(depth: number): AST {
    const token = this.current;
    if (token.type === 'number') { this.consume(); return this.add({ kind: 'literal', value: Number(token.value) }, depth); }
    if (token.type === 'string') { this.consume(); return this.add({ kind: 'literal', value: token.value }, depth); }
    if (token.type === 'identifier') {
      this.consume();
      if (token.value === 'true') return this.add({ kind: 'literal', value: true }, depth);
      if (token.value === 'false') return this.add({ kind: 'literal', value: false }, depth);
      if (token.value === 'null') return this.add({ kind: 'literal', value: null }, depth);
      return this.add({ kind: 'identifier', name: token.value }, depth);
    }
    if (token.type === 'operator' && ['!', '+', '-'].includes(token.value)) {
      const operator = this.consume().value; return this.add({ kind: 'unary', operator, argument: this.parseExpression(8, depth + 1) }, depth);
    }
    if (token.value === '(') { this.consume('('); const expression = this.parseExpression(0, depth + 1); this.consume(')'); return expression; }
    if (token.value === '[') {
      this.consume('['); const elements: AST[] = [];
      while (this.current.value !== ']') {
        if (elements.length >= this.budget.maxArrayLength) throw new Error('Array literal exceeds budget.');
        elements.push(this.parseExpression(0, depth + 1));
        if ((this.current as Token).value !== ',') break; this.consume(',');
      }
      this.consume(']'); return this.add({ kind: 'array', elements }, depth);
    }
    throw new Error(`Unexpected token '${token.value}' at ${token.pos}.`);
  }
  private parsePostfix(base: AST, depth: number): AST {
    let expression = base;
    while (true) {
      if (this.current.value === '.') {
        this.consume('.'); const property = this.consume().value;
        if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(property)) throw new Error('Invalid member property.');
        if (['__proto__', 'prototype', 'constructor'].includes(property)) throw new Error(`Forbidden property '${property}'.`);
        expression = this.add({ kind: 'member', object: expression, property }, depth);
      } else if (this.current.value === '(') {
        this.consume('('); const args: AST[] = [];
        while ((this.current as Token).value !== ')') {
          if (args.length >= 32) throw new Error('Too many function arguments.');
          args.push(this.parseExpression(0, depth + 1));
          if ((this.current as Token).value !== ',') break; this.consume(',');
        }
        this.consume(')'); expression = this.add({ kind: 'call', callee: expression, args }, depth);
      } else break;
    }
    return expression;
  }
}

function dependencyPath(node: AST): string | null {
  if (node.kind === 'identifier') return node.name;
  if (node.kind === 'member') { const base = dependencyPath(node.object); return base ? `${base}.${node.property}` : null; }
  return null;
}
function collectDependencies(node: AST, out: Set<string>): void {
  const path = dependencyPath(node);
  if (path && /^(vars|context|input|node)\./.test(path)) out.add(path);
  switch (node.kind) {
    case 'member': collectDependencies(node.object, out); break;
    case 'unary': collectDependencies(node.argument, out); break;
    case 'binary': collectDependencies(node.left, out); collectDependencies(node.right, out); break;
    case 'conditional': collectDependencies(node.test, out); collectDependencies(node.consequent, out); collectDependencies(node.alternate, out); break;
    case 'call': collectDependencies(node.callee, out); node.args.forEach(arg => collectDependencies(arg, out)); break;
    case 'array': node.elements.forEach(element => collectDependencies(element, out)); break;
    default: break;
  }
}

export function parseExpression(source: string, budget = DEFAULT_EXPRESSION_BUDGET): ParsedExpression { return new Parser(source, budget).parse(); }

function getMember(object: unknown, property: string): unknown {
  if (object === null || typeof object !== 'object') return undefined;
  if (['__proto__', 'prototype', 'constructor'].includes(property)) throw new Error(`Forbidden property '${property}'.`);
  if (!Object.prototype.hasOwnProperty.call(object, property)) return undefined;
  return (object as Record<string, unknown>)[property];
}

function number(value: unknown): number { const result = Number(value); if (!Number.isFinite(result)) throw new Error(`Expected finite number, received ${String(value)}.`); return result; }
function bool(value: unknown): boolean { return Boolean(value); }
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
function fract(value: number): number { return value - Math.floor(value); }
function hashToUnit(text: string): number {
  const hex = fnv1a64(text); const low = Number(BigInt(`0x${hex}`) & 0xffffffffn); return low / 0x100000000;
}
export function deterministicRandom(seed: number, scope: string, index = 0): number { return hashToUnit(`${seed}|${scope}|${index}`); }
function noise1D(x: number, seed: number, scope: string): number {
  const i = Math.floor(x); const f = fract(x); const a = deterministicRandom(seed, scope, i); const b = deterministicRandom(seed, scope, i + 1);
  const u = f * f * (3 - 2 * f); return a + (b - a) * u;
}
function noise2D(x: number, y: number, seed: number, scope: string): number {
  const xi = Math.floor(x); const yi = Math.floor(y); const xf = fract(x); const yf = fract(y);
  const sample = (dx: number, dy: number) => deterministicRandom(seed, scope, (xi + dx) * 73856093 ^ (yi + dy) * 19349663);
  const sx = xf * xf * (3 - 2 * xf); const sy = yf * yf * (3 - 2 * yf);
  const top = sample(0,0) + (sample(1,0) - sample(0,0)) * sx;
  const bottom = sample(0,1) + (sample(1,1) - sample(0,1)) * sx;
  return top + (bottom - top) * sy;
}

function functions(context: VSRExpressionContext): Record<string, (...args: unknown[]) => unknown> {
  const scope = context.scopeId ?? 'expression';
  return {
    abs: x => Math.abs(number(x)), min: (...xs) => Math.min(...xs.map(number)), max: (...xs) => Math.max(...xs.map(number)),
    clamp: (x, min, max) => clamp(number(x), number(min), number(max)),
    lerp: (a,b,t) => number(a) + (number(b)-number(a))*number(t),
    inverseLerp: (a,b,x) => (number(x)-number(a))/(number(b)-number(a)),
    remap: (inA,inB,outA,outB,x) => number(outA)+(number(outB)-number(outA))*((number(x)-number(inA))/(number(inB)-number(inA))),
    sin: x => Math.sin(number(x)), cos: x => Math.cos(number(x)), floor: x => Math.floor(number(x)), ceil: x => Math.ceil(number(x)), round: x => Math.round(number(x)),
    fract: x => fract(number(x)), smoothstep: (a,b,x) => { const t = clamp((number(x)-number(a))/(number(b)-number(a)),0,1); return t*t*(3-2*t); },
    random: (index = 0) => deterministicRandom(context.seed, scope, number(index)),
    noise1D: x => noise1D(number(x), context.seed, scope), noise2D: (x,y) => noise2D(number(x), number(y), context.seed, scope),
    formatNumber: (x, digits = 0) => number(x).toFixed(clamp(Math.trunc(number(digits)), 0, 20)),
    formatTime: x => { const total = Math.max(0, Math.floor(number(x))); const m = Math.floor(total/60); const s = total%60; return `${m}:${String(s).padStart(2,'0')}`; }
  };
}

function evaluateAst(ast: AST, context: VSRExpressionContext, budget: VSRExpressionBudget, counter: { steps: number }): unknown {
  counter.steps++; if (counter.steps > budget.maxSteps) throw new Error('Expression execution budget exceeded.');
  switch (ast.kind) {
    case 'literal': return ast.value;
    case 'identifier': {
      const roots: Record<string, unknown> = { time: context.time, frame: context.frame, fps: context.fps, vars: context.vars, context: context.context, input: context.input, node: context.node ?? {} };
      if (Object.prototype.hasOwnProperty.call(roots, ast.name)) return roots[ast.name];
      const fn = functions(context)[ast.name]; if (fn) return fn;
      throw new Error(`Unknown identifier '${ast.name}'.`);
    }
    case 'member': return getMember(evaluateAst(ast.object, context, budget, counter), ast.property);
    case 'unary': {
      const value = evaluateAst(ast.argument, context, budget, counter);
      if (ast.operator === '!') return !bool(value); if (ast.operator === '+') return number(value); if (ast.operator === '-') return -number(value);
      throw new Error(`Unsupported unary operator '${ast.operator}'.`);
    }
    case 'binary': {
      if (ast.operator === '&&') { const left = evaluateAst(ast.left, context, budget, counter); return bool(left) ? evaluateAst(ast.right, context, budget, counter) : left; }
      if (ast.operator === '||') { const left = evaluateAst(ast.left, context, budget, counter); return bool(left) ? left : evaluateAst(ast.right, context, budget, counter); }
      const left = evaluateAst(ast.left, context, budget, counter); const right = evaluateAst(ast.right, context, budget, counter);
      switch (ast.operator) {
        case '+': return typeof left === 'string' || typeof right === 'string' ? `${String(left)}${String(right)}` : number(left)+number(right);
        case '-': return number(left)-number(right); case '*': return number(left)*number(right); case '/': return number(left)/number(right); case '%': return number(left)%number(right); case '**': return number(left)**number(right);
        case '<': return number(left)<number(right); case '<=': return number(left)<=number(right); case '>': return number(left)>number(right); case '>=': return number(left)>=number(right);
        case '==': case '===': return left === right; case '!=': case '!==': return left !== right;
        default: throw new Error(`Unsupported binary operator '${ast.operator}'.`);
      }
    }
    case 'conditional': return bool(evaluateAst(ast.test, context, budget, counter)) ? evaluateAst(ast.consequent, context, budget, counter) : evaluateAst(ast.alternate, context, budget, counter);
    case 'call': {
      const fn = evaluateAst(ast.callee, context, budget, counter);
      if (typeof fn !== 'function') throw new Error('Attempted to call a non-function.');
      return fn(...ast.args.map(arg => evaluateAst(arg, context, budget, counter)));
    }
    case 'array': return ast.elements.map(element => evaluateAst(element, context, budget, counter));
  }
}

export function evaluateExpression(parsedOrSource: ParsedExpression | string, context: VSRExpressionContext, budget = DEFAULT_EXPRESSION_BUDGET): VSRValue {
  const parsed = typeof parsedOrSource === 'string' ? parseExpression(parsedOrSource, budget) : parsedOrSource;
  const result = evaluateAst(parsed.ast, context, budget, { steps: 0 });
  if (typeof result === 'function' || result === undefined || typeof result === 'bigint' || typeof result === 'symbol') throw new Error('Expression returned unsupported value.');
  return result as VSRValue;
}
