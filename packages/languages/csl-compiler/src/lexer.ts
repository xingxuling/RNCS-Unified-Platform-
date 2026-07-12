import { Token, TokenType } from './types';

// CSL v0.8 — 严格保留字白名单：只保留结构控制词
// 业务字段名（名称/密度/导电率/类型/层级 等）一律识别为 IDENTIFIER
// 类型名（文本/数值/枚举）暂按 IDENTIFIER 处理，由 parser 上下文判定
//
// v0.9 待开放（暂不识别为关键字，保持降级为 IDENTIFIER）：
//   函数/如果/则/否则/否则如果/调用/模板/展开
//   主体/主权阶段/阶段转移/编译层/再生事件/信号/从/到/触发
//   映射表/封口/同位链/域展开/列/行/域/五因/母法/由
//   单元/编制/档位/权衡/层级/模块/定义/价值/代价/价值分/代价分/下限/上限/单元集/阈值
//   引擎/动作/轴/隶属/类型/定位/职责/前置/后置/约束/序号/含义/作用
//   概念块/命题块/关系块/母体/版本/历史/状态/...
const KEYWORDS = new Set([
  // —— v0.8 核心结构词（19 个） ——
  '概念', '实例', '模板', '展开',
  '属性', '关系', '不变量', '规则', '证据',
  '属于', '作用域', '条件', '动作', '返回',
  '标记', '排除', '满足', '且', '或',
  // —— 仅作为字面量类型修饰符保留（不破坏 0.1/0.2 基础示例） ——
  '枚举',
]);



const OPERATORS: Record<string, string> = {
  '=': '=', '≠': '≠', '!=': '≠',
  '>': '>', '<': '<', '≥': '≥', '≤': '≤',
  '>=': '≥', '<=': '≤', '∈': '∈',
};

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  const peek = () => pos < input.length ? input[pos] : '';
  const advance = () => {
    const ch = input[pos++];
    if (ch === '\n') { line++; col = 1; } else { col++; }
    return ch;
  };

  while (pos < input.length) {
    const ch = peek();

    // Whitespace
    if (/\s/.test(ch)) { advance(); continue; }

    // Comments (// to end of line)
    if (ch === '/' && pos + 1 < input.length && input[pos + 1] === '/') {
      while (pos < input.length && peek() !== '\n') advance();
      continue;
    }

    const startLine = line;
    const startCol = col;

    // String literals
    if (ch === '"' || ch === '\u201c' || ch === '\u201d') {
      advance();
      let str = '';
      while (pos < input.length) {
        const c = peek();
        if (c === '"' || c === '\u201c' || c === '\u201d') { advance(); break; }
        str += advance();
      }
      tokens.push({ type: 'STRING', value: str, line: startLine, col: startCol });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === '-' && pos + 1 < input.length && /[0-9]/.test(input[pos + 1]))) {
      let num = '';
      if (ch === '-') num += advance();
      while (pos < input.length && /[0-9.]/.test(peek())) num += advance();
      tokens.push({ type: 'NUMBER', value: num, line: startLine, col: startCol });
      continue;
    }

    // Angle brackets for template params — 仅在 `模板`/`展开` 上下文下识别
    // 形式：`模板 Name <` 或 `展开 Name <`，再匹配一个 `>` 闭合
    if (ch === '<' && !(pos + 1 < input.length && input[pos + 1] === '=')) {
      const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
      const prev2 = tokens.length > 1 ? tokens[tokens.length - 2] : null;
      const isTemplateCtx = lastToken && lastToken.type === 'IDENTIFIER' &&
        prev2 && prev2.type === 'KEYWORD' && (prev2.value === '模板' || prev2.value === '展开');
      if (isTemplateCtx) {
        advance();
        tokens.push({ type: 'LANGLE', value: '<', line: startLine, col: startCol });
        continue;
      }
    }
    if (ch === '>' && !(pos + 1 < input.length && input[pos + 1] === '=')) {
      // 闭合 LANGLE：向回找最近的 LANGLE，且中间无 LBRACE
      let hasLangle = false;
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (tokens[i].type === 'LANGLE') { hasLangle = true; break; }
        if (tokens[i].type === 'LBRACE' || tokens[i].type === 'RANGLE') break;
      }
      if (hasLangle) {
        advance();
        tokens.push({ type: 'RANGLE', value: '>', line: startLine, col: startCol });
        continue;
      }
    }

    // Two-char operators
    if (pos + 1 < input.length) {
      const two = input.slice(pos, pos + 2);
      if (OPERATORS[two]) {
        advance(); advance();
        tokens.push({ type: 'OPERATOR', value: OPERATORS[two], line: startLine, col: startCol });
        continue;
      }
    }

    // Single-char operators
    if (OPERATORS[ch]) {
      advance();
      tokens.push({ type: 'OPERATOR', value: OPERATORS[ch], line: startLine, col: startCol });
      continue;
    }

    // Unicode operators
    if ('≠≥≤∈'.includes(ch)) {
      advance();
      tokens.push({ type: 'OPERATOR', value: ch, line: startLine, col: startCol });
      continue;
    }

    // Punctuation
    const punctMap: Record<string, TokenType> = {
      '{': 'LBRACE', '}': 'RBRACE',
      '(': 'LPAREN', ')': 'RPAREN',
      ':': 'COLON', ',': 'COMMA', '.': 'DOT',
    };
    if (punctMap[ch]) {
      advance();
      tokens.push({ type: punctMap[ch], value: ch, line: startLine, col: startCol });
      continue;
    }

    // Identifiers & keywords (Chinese + alphanumeric + underscore)
    if (/[\u4e00-\u9fff\w]/.test(ch)) {
      let ident = '';
      while (pos < input.length && /[\u4e00-\u9fff\w]/.test(peek())) {
        ident += advance();
      }
      const type: TokenType = KEYWORDS.has(ident) ? 'KEYWORD' : 'IDENTIFIER';
      tokens.push({ type, value: ident, line: startLine, col: startCol });
      continue;
    }

    // Unknown char - skip
    advance();
  }

  tokens.push({ type: 'EOF', value: '', line, col });
  return tokens;
}
