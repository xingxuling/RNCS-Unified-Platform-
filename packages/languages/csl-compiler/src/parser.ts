import { Token } from './types';
import type {
  ASTNode, ProgramNode, ConceptDeclNode, EntityDeclNode,
  AttributeDeclNode, InlineInvariantNode, InvariantDeclNode,
  RuleDeclNode, EvidenceDeclNode, AssignmentExprNode,
  ConditionExprNode, ActionExprNode, RelationDeclNode,
  FunctionDeclNode, IfExprNode, FunctionCallExprNode,
  TemplateDeclNode, TemplateExpandNode,
  SubjectDeclNode, StageDeclNode, TransitionDeclNode,
  CompilerLayerDeclNode, RegenerationDeclNode, SignalDeclNode,
  MappingTableDeclNode, ClosureDeclNode, CorrespondenceChainDeclNode, DomainExpansionDeclNode,
  UnitDeclNode, EstablishmentDeclNode, ProfileDeclNode, TradeoffDeclNode,
  EngineDeclNode, ModuleDeclNode, EngineActionDeclNode, AxisDeclNode, EngineKind,
  ConceptBlockDeclNode, PropositionBlockDeclNode, RelationBlockDeclNode, ConceptBlockKind,
} from './types';
import { isFeatureDisabled, TOPLEVEL_KEYWORD_TO_FEATURE, INLINE_KEYWORD_TO_FEATURE } from './versions/dispatch';


export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '', line: 0, col: 0 };
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: string, value?: string): Token {
    const t = this.advance();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`解析错误：第 ${t.line} 行第 ${t.col} 列，期望 ${type}${value ? `(${value})` : ''}，得到 ${t.type}(${t.value})`);
    }
    return t;
  }

  private match(type: string, value?: string): boolean {
    const t = this.peek();
    return t.type === type && (value === undefined || t.value === value);
  }

  /** Phase 2.4 spec-driven dispatch v3 (inline 关键字层):
   *  在内联(非顶层)位置遇到 KEYWORD 时,先比对 INLINE_KEYWORD_TO_FEATURE,
   *  若该 feature 被规格层关闭,直接抛出明确的 [规格阻塞] 诊断,而不是落入"未知元素"。
   */
  private assertInlineFeatureEnabled(t: Token): void {
    if (t.type !== 'KEYWORD') return;
    const fid = INLINE_KEYWORD_TO_FEATURE[t.value];
    if (fid && isFeatureDisabled(fid)) {
      throw new Error(
        `[规格阻塞] 第 ${t.line} 行第 ${t.col} 列:` +
        `内联语法「${t.value}」属于 feature「${fid}」,该 feature 已被规格层关闭,` +
        `parser 拒绝构造对应 AST 节点。请到「自举规格」面板恢复该 feature。`,
      );
    }
  }

  parse(): ProgramNode {
    const body: ASTNode[] = [];
    while (!this.match('EOF')) {
      body.push(this.parseTopLevel());
    }
    return { type: 'Program', body };
  }

  private parseTopLevel(): ASTNode {
    const t = this.peek();

    // Phase 2.4 spec-driven dispatch v2 (parser 层):
    //   即使 lexer 已剔除关键字,parser 也基于 TOPLEVEL_KEYWORD_TO_FEATURE 双保险拦截
    //   - IDENTIFIER 命中 = 词法已降级,需要规格化的诊断而非"未知顶层声明"
    //   - KEYWORD 命中 = 词法漏过,parser 直接拒绝构造 AST
    const featureId = TOPLEVEL_KEYWORD_TO_FEATURE[t.value];
    if (featureId && isFeatureDisabled(featureId)) {
      throw new Error(
        `[规格阻塞] 第 ${t.line} 行第 ${t.col} 列：` +
        `语法「${t.value}」属于 feature「${featureId}」,该 feature 已被规格层(feature-map.csl 或试验台)关闭,` +
        `parser 拒绝构造对应 AST 节点。请到「自举规格」面板恢复该 feature。`,
      );
    }

    if (t.type === 'KEYWORD') {
      switch (t.value) {
        case '概念': return this.parseConcept();
        case '实例': return this.parseEntity();
        case '不变量': return this.parseInvariant();
        case '规则': return this.parseRule();
        case '证据': return this.parseEvidence();
        case '关系': return this.parseRelation();
        case '函数': return this.parseFunction();
        case '模板': return this.parseTemplate();
        case '展开': return this.parseTemplateExpand();
        // 0.3
        case '主体': return this.parseSubject();
        case '主权阶段': return this.parseStage();
        case '阶段转移': return this.parseTransition();
        case '编译层': return this.parseCompilerLayer();
        case '再生事件': return this.parseRegeneration();
        case '信号': return this.parseSignal();
        // 0.4
        case '映射表': return this.parseMappingTable();
        case '封口': return this.parseClosure();
        case '同位链': return this.parseCorrespondenceChain();
        case '域展开': return this.parseDomainExpansion();
        // 0.5
        case '单元': return this.parseUnit();
        case '编制': return this.parseEstablishment();
        case '档位': return this.parseProfile();
        case '权衡': return this.parseTradeoff();
        // 0.6
        case '引擎': return this.parseEngine();
        case '模块': return this.parseModule();
        case '动作': return this.parseEngineAction();
        case '轴': return this.parseAxis();
        // 0.7 — 概念级 AI 长期记忆块
        case '概念块': return this.parseConceptBlock();
        case '命题块': return this.parsePropositionBlock();
        case '关系块': return this.parseRelationBlock();
      }
    }
    throw new Error(`解析错误：第 ${t.line} 行第 ${t.col} 列，未知的顶层声明 "${t.value}"`);
  }


  // ==================== Existing parsers ====================

  private parseConcept(): ConceptDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    let parent: string | null = null;
    if (this.match('KEYWORD', '属于')) {
      this.advance();
      parent = this.expect('IDENTIFIER').value;
    }
    this.expect('LBRACE');
    const body: ASTNode[] = [];
    while (!this.match('RBRACE') && !this.match('EOF')) {
      body.push(this.parseConceptBody());
    }
    const end = this.expect('RBRACE');
    return { type: 'ConceptDecl', name, parent, body, source_span: { line_start: start.line, line_end: end.line } };
  }

  private parseConceptBody(): ASTNode {
    const t = this.peek();
    if (t.type === 'KEYWORD' && t.value === '属性') return this.parseAttribute();
    if (t.type === 'KEYWORD' && t.value === '不变量') return this.parseInlineInvariant();
    throw new Error(`解析错误：第 ${t.line} 行，概念体中未知元素 "${t.value}"`);
  }

  private parseAttribute(): AttributeDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    this.expect('COLON');
    const typeToken = this.peek();
    let value_type: string;
    const type_args: Record<string, unknown> = {};

    if (typeToken.type === 'KEYWORD' && typeToken.value === '枚举') {
      this.advance();
      value_type = '枚举';
      this.expect('LBRACE');
      const values: string[] = [];
      while (!this.match('RBRACE') && !this.match('EOF')) {
        values.push(this.expect('IDENTIFIER').value);
        if (this.match('COMMA')) this.advance();
      }
      this.expect('RBRACE');
      type_args.values = values;
    } else {
      value_type = this.expect('IDENTIFIER').value;
      if (this.match('LPAREN')) {
        this.advance();
        while (!this.match('RPAREN') && !this.match('EOF')) {
          const key = this.expect('IDENTIFIER').value;
          this.expect('COLON');
          const val = this.advance().value;
          type_args[key] = val;
          if (this.match('COMMA')) this.advance();
        }
        this.expect('RPAREN');
      }
    }
    return { type: 'AttributeDecl', name, value_type, type_args, source_span: { line_start: start.line, line_end: start.line } };
  }

  private parseInlineInvariant(): InlineInvariantNode {
    const start = this.advance();
    const expr = this.parseConditionExpr();
    return { type: 'InlineInvariant', expr, source_span: { line_start: start.line, line_end: start.line } };
  }

  private parseConditionExpr(): ConditionExprNode {
    const left = this.advance().value;
    let leftPath = left;
    while (this.match('DOT')) {
      this.advance();
      leftPath += '.' + this.advance().value;
    }
    const op = this.expect('OPERATOR').value;
    const rightToken = this.advance();
    let right: unknown = rightToken.value;
    if (rightToken.type === 'NUMBER') right = Number(rightToken.value);
    return { type: 'ConditionExpr', left: leftPath, op, right };
  }

  private parseEntity(): EntityDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    this.expect('KEYWORD', '属于');
    const concept = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');
    const body: ASTNode[] = [];
    while (!this.match('RBRACE') && !this.match('EOF')) {
      body.push(this.parseAssignment());
    }
    const end = this.expect('RBRACE');
    return { type: 'EntityDecl', name, concept, body, source_span: { line_start: start.line, line_end: end.line } };
  }

  private parseAssignment(): AssignmentExprNode {
    const target = this.expect('IDENTIFIER').value;
    this.expect('OPERATOR', '=');
    const valToken = this.advance();
    let value: unknown = valToken.value;
    if (valToken.type === 'NUMBER') value = Number(valToken.value);
    return { type: 'AssignmentExpr', target, value };
  }

  private parseInvariant(): InvariantDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    let scope = '';
    if (this.match('KEYWORD', '作用域')) {
      this.advance();
      scope = this.expect('IDENTIFIER').value;
    }
    this.expect('LBRACE');
    const clauses: ConditionExprNode[] = [];
    while (!this.match('RBRACE') && !this.match('EOF')) {
      // v0.8: '要求'/'且' 既可能是 KEYWORD（且），也可能是 IDENTIFIER（要求降级后）
      if (this.match('KEYWORD', '且') || this.match('IDENTIFIER', '要求') || this.match('KEYWORD', '条件')) {
        this.advance();
      }
      clauses.push(this.parseConditionExpr());
    }
    const end = this.expect('RBRACE');
    return { type: 'InvariantDecl', name, scope, clauses, source_span: { line_start: start.line, line_end: end.line } };
  }

  private parseRule(): RuleDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');
    const conditions: ConditionExprNode[] = [];
    const actions: ActionExprNode[] = [];
    let priority = '中';

    while (!this.match('RBRACE') && !this.match('EOF')) {
      const t = this.peek();
      this.assertInlineFeatureEnabled(t);
      if (t.type === 'KEYWORD' && (t.value === '条件' || t.value === '且')) {
        this.advance();
        conditions.push(this.parseConditionExpr());
      } else if (t.type === 'KEYWORD' && t.value === '动作') {
        this.advance();
        actions.push(this.parseActionInBody());
      } else if (t.type === 'IDENTIFIER' && t.value === '优先级') {
        // v0.8: 优先级降级为 IDENTIFIER
        this.advance();
        priority = this.expect('IDENTIFIER').value;
      } else if (t.type === 'KEYWORD' && t.value === '返回') {
        this.advance();
        const val = this.advance().value;
        actions.push({ type: 'ActionExpr', action_type: 'return', payload: { value: val } });
      } else if ((t.type === 'KEYWORD' && t.value === '标记') ||
                 (t.type === 'IDENTIFIER' && t.value === '标记为')) {
        // v0.8: 兼容 "标记 X" 与历史 "标记为 X"
        this.advance();
        // 跳过可选的 '为'
        if (this.peek().type === 'IDENTIFIER' && this.peek().value === '为') this.advance();
        const label = this.advance().value;
        actions.push({ type: 'ActionExpr', action_type: 'mark', payload: { label } });
      } else if (t.type === 'KEYWORD' && t.value === '排除') {
        this.advance();
        actions.push({ type: 'ActionExpr', action_type: 'exclude', payload: {} });
      } else {
        conditions.push(this.parseConditionExpr());
      }
    }
    const end = this.expect('RBRACE');
    return { type: 'RuleDecl', name, conditions, actions, priority, source_span: { line_start: start.line, line_end: end.line } };
  }

  private parseActionInBody(): ActionExprNode {
    const t = this.peek();
    this.assertInlineFeatureEnabled(t);
    if (t.type === 'KEYWORD' && t.value === '返回') {
      this.advance();
      const val = this.advance().value;
      return { type: 'ActionExpr', action_type: 'return', payload: { value: val } };
    }
    if ((t.type === 'KEYWORD' && t.value === '标记') ||
        (t.type === 'IDENTIFIER' && t.value === '标记为')) {
      this.advance();
      if (this.peek().type === 'IDENTIFIER' && this.peek().value === '为') this.advance();
      const label = this.advance().value;
      return { type: 'ActionExpr', action_type: 'mark', payload: { label } };
    }
    if (t.type === 'KEYWORD' && t.value === '排除') {
      this.advance();
      return { type: 'ActionExpr', action_type: 'exclude', payload: {} };
    }
    const label = this.advance().value;
    return { type: 'ActionExpr', action_type: 'mark', payload: { label } };
  }

  private parseEvidence(): EvidenceDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');
    let source = '';
    let snippet = '';
    const supports: string[] = [];

    while (!this.match('RBRACE') && !this.match('EOF')) {
      const t = this.peek();
      if (t.type === 'IDENTIFIER' && t.value === '来源') {
        this.advance(); this.expect('OPERATOR', '=');
        source = this.advance().value;
      } else if (t.type === 'IDENTIFIER' && t.value === '原文') {
        this.advance(); this.expect('OPERATOR', '=');
        snippet = this.advance().value;
      } else if (t.type === 'IDENTIFIER' && t.value === '支持') {
        this.advance(); this.expect('OPERATOR', '=');
        supports.push(this.advance().value);
        while (this.match('COMMA')) {
          this.advance();
          supports.push(this.advance().value);
        }
      } else {
        this.advance();
      }
    }
    const end = this.expect('RBRACE');
    return { type: 'EvidenceDecl', name, source, snippet, supports, source_span: { line_start: start.line, line_end: end.line } };
  }

  private parseRelation(): RelationDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const source_ref = this.expect('IDENTIFIER').value;
    this.advance(); // skip connector
    const target_ref = this.expect('IDENTIFIER').value;
    return { type: 'RelationDecl', name, source_ref, target_ref, source_span: { line_start: start.line, line_end: start.line } };
  }

  // ==================== New: Function ====================

  private parseFunction(): FunctionDeclNode {
    const start = this.advance(); // '函数'
    const name = this.expect('IDENTIFIER').value;
    this.expect('LPAREN');
    const params: string[] = [];
    while (!this.match('RPAREN') && !this.match('EOF')) {
      params.push(this.expect('IDENTIFIER').value);
      if (this.match('COMMA')) this.advance();
    }
    this.expect('RPAREN');
    this.expect('LBRACE');
    const body: ASTNode[] = [];
    while (!this.match('RBRACE') && !this.match('EOF')) {
      body.push(this.parseFunctionBody());
    }
    const end = this.expect('RBRACE');
    return { type: 'FunctionDecl', name, params, body, source_span: { line_start: start.line, line_end: end.line } };
  }

  private parseFunctionBody(): ASTNode {
    const t = this.peek();
    this.assertInlineFeatureEnabled(t);
    if (t.type === 'KEYWORD' && t.value === '如果') return this.parseIfExpr();
    if (t.type === 'KEYWORD' && t.value === '返回') {
      this.advance();
      const val = this.advance().value;
      return { type: 'ActionExpr', action_type: 'return', payload: { value: val } } as ActionExprNode;
    }
    if (t.type === 'KEYWORD' && t.value === '标记为') {
      this.advance();
      const label = this.advance().value;
      return { type: 'ActionExpr', action_type: 'mark', payload: { label } } as ActionExprNode;
    }
    if (t.type === 'KEYWORD' && t.value === '调用') {
      this.advance();
      return this.parseFunctionCall();
    }
    // Assignment or condition
    if (t.type === 'IDENTIFIER') {
      // Look ahead for = operator
      const savedPos = this.pos;
      const ident = this.advance();
      if (this.match('OPERATOR', '=')) {
        this.advance();
        const valToken = this.advance();
        let value: unknown = valToken.value;
        if (valToken.type === 'NUMBER') value = Number(valToken.value);
        return { type: 'AssignmentExpr', target: ident.value, value } as AssignmentExprNode;
      }
      // Restore and parse as condition
      this.pos = savedPos;
    }
    return this.parseConditionExpr();
  }

  // ==================== New: If/Else ====================

  private parseIfExpr(): IfExprNode {
    const start = this.advance(); // '如果'
    const condition = this.parseConditionExpr();
    this.expect('KEYWORD', '则');

    const then_branch = this.parseBranchBody();
    const else_if_branches: Array<{ condition: ConditionExprNode; body: ASTNode[] }> = [];
    let else_branch: ASTNode[] = [];

    while (this.match('KEYWORD', '否则如果')) {
      this.advance();
      const elifCond = this.parseConditionExpr();
      this.expect('KEYWORD', '则');
      const elifBody = this.parseBranchBody();
      else_if_branches.push({ condition: elifCond, body: elifBody });
    }

    if (this.match('KEYWORD', '否则')) {
      this.advance();
      else_branch = this.parseBranchBody();
    }

    return {
      type: 'IfExpr', condition, then_branch, else_if_branches, else_branch,
      source_span: { line_start: start.line, line_end: this.peek().line },
    };
  }

  private parseBranchBody(): ASTNode[] {
    // Branch can be a single statement or a block { ... }
    if (this.match('LBRACE')) {
      this.advance();
      const body: ASTNode[] = [];
      while (!this.match('RBRACE') && !this.match('EOF')) {
        body.push(this.parseFunctionBody());
      }
      this.expect('RBRACE');
      return body;
    }
    // Single statement
    return [this.parseFunctionBody()];
  }

  // ==================== New: Function Call ====================

  private parseFunctionCall(): FunctionCallExprNode {
    const name = this.expect('IDENTIFIER').value;
    this.expect('LPAREN');
    const args: string[] = [];
    while (!this.match('RPAREN') && !this.match('EOF')) {
      args.push(this.advance().value);
      if (this.match('COMMA')) this.advance();
    }
    this.expect('RPAREN');
    return { type: 'FunctionCallExpr', name, args };
  }

  // ==================== New: Template ====================

  private parseTemplate(): TemplateDeclNode {
    const start = this.advance(); // '模板'
    const name = this.expect('IDENTIFIER').value;
    const type_params: string[] = [];
    // 类型参数列表可选：模板 名称 { ... } 或 模板 名称<T, U> { ... }
    if (this.match('LANGLE')) {
      this.advance();
      while (!this.match('RANGLE') && !this.match('EOF')) {
        type_params.push(this.expect('IDENTIFIER').value);
        if (this.match('COMMA')) this.advance();
      }
      this.expect('RANGLE');
    }
    this.expect('LBRACE');
    const body: ASTNode[] = [];
    while (!this.match('RBRACE') && !this.match('EOF')) {
      body.push(this.parseConceptBody());
    }
    const end = this.expect('RBRACE');
    return { type: 'TemplateDecl', name, type_params, body, source_span: { line_start: start.line, line_end: end.line } };
  }

  private parseTemplateExpand(): TemplateExpandNode {
    const start = this.advance(); // '展开'
    const template_name = this.expect('IDENTIFIER').value;
    this.expect('LANGLE');
    const type_args: string[] = [];
    while (!this.match('RANGLE') && !this.match('EOF')) {
      type_args.push(this.expect('IDENTIFIER').value);
      if (this.match('COMMA')) this.advance();
    }
    this.expect('RANGLE');

    // Optional: target name with '为'
    let target_name = template_name + '_' + type_args.join('_');
    if (this.match('KEYWORD', '属于') || (this.peek().type === 'IDENTIFIER' && this.peek().value === '为')) {
      this.advance();
      target_name = this.expect('IDENTIFIER').value;
    }

    return { type: 'TemplateExpand', template_name, type_args, target_name, source_span: { line_start: start.line, line_end: start.line } };
  }

  // ==================== New in 0.3: 高阶语义原语 ====================

  /** 通用 key-value 块解析器：{ 键 = 值, ... }，值可为字面量或 (a, b, c) 列表 */
  private parseKVBlock(): Record<string, unknown> {
    this.expect('LBRACE');
    const result: Record<string, unknown> = {};
    while (!this.match('RBRACE') && !this.match('EOF')) {
      const key = this.advance().value;
      this.expect('OPERATOR', '=');
      if (this.match('LPAREN')) {
        this.advance();
        const list: string[] = [];
        while (!this.match('RPAREN') && !this.match('EOF')) {
          list.push(this.advance().value);
          if (this.match('COMMA')) this.advance();
        }
        this.expect('RPAREN');
        result[key] = list;
      } else {
        const tok = this.advance();
        result[key] = tok.type === 'NUMBER' ? Number(tok.value) : tok.value;
      }
      if (this.match('COMMA')) this.advance();
    }
    this.expect('RBRACE');
    return result;
  }

  private parseSubject(): SubjectDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const kv = this.parseKVBlock();
    const current_stage = (kv['当前阶段'] as string) || null;
    delete kv['当前阶段'];
    return {
      type: 'SubjectDecl', name, current_stage, attributes: kv,
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  private parseStage(): StageDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const kv = this.parseKVBlock();
    return {
      type: 'StageDecl', name,
      index: typeof kv['序号'] === 'number' ? (kv['序号'] as number) : null,
      keywords: (kv['关键词'] as string[]) || [],
      description: (kv['描述'] as string) || '',
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  private parseTransition(): TransitionDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');
    let from_stage = '';
    let to_stage = '';
    let trigger: ConditionExprNode | null = null;
    while (!this.match('RBRACE') && !this.match('EOF')) {
      const t = this.peek();
      if (t.type === 'KEYWORD' && t.value === '从') {
        this.advance();
        from_stage = this.advance().value;
      } else if (t.type === 'KEYWORD' && t.value === '到') {
        this.advance();
        to_stage = this.advance().value;
      } else if (t.type === 'KEYWORD' && t.value === '触发') {
        this.advance();
        trigger = this.parseConditionExpr();
      } else {
        this.advance();
      }
      if (this.match('COMMA')) this.advance();
    }
    this.expect('RBRACE');
    return {
      type: 'TransitionDecl', name, from_stage, to_stage, trigger,
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  private parseCompilerLayer(): CompilerLayerDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const kv = this.parseKVBlock();
    return {
      type: 'CompilerLayerDecl', name,
      level: (kv['层级'] as string) || '',
      inputs: (kv['输入'] as string[]) || [],
      outputs: (kv['输出'] as string[]) || [],
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  private parseRegeneration(): RegenerationDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const kv = this.parseKVBlock();
    return {
      type: 'RegenerationDecl', name,
      subject_ref: (kv['主体'] as string) || '',
      failure: (kv['失配'] as string) || '',
      diagnosis: (kv['诊断'] as string) || '',
      recompose: (kv['重组'] as string) || '',
      new_version: (kv['新版本'] as string) || '',
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  private parseSignal(): SignalDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const kv = this.parseKVBlock();
    return {
      type: 'SignalDecl', name,
      kind: (kv['类型'] as string) || '',
      intensity: typeof kv['强度'] === 'number' ? (kv['强度'] as number) : 0,
      description: (kv['描述'] as string) || '',
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  // ==================== New in 0.4: 东方本体论原语 ====================

  /** 解析括号内的标识符/字符串列表：(a, b, "c") */
  private parseParenList(): string[] {
    this.expect('LPAREN');
    const list: string[] = [];
    while (!this.match('RPAREN') && !this.match('EOF')) {
      list.push(this.advance().value);
      if (this.match('COMMA')) this.advance();
    }
    this.expect('RPAREN');
    return list;
  }

  /** 解析括号内的 key:value 对列表：(天罡:36, 地煞:72) */
  private parseLabeledParenList(): Array<{ label: string; value: number }> {
    this.expect('LPAREN');
    const list: Array<{ label: string; value: number }> = [];
    while (!this.match('RPAREN') && !this.match('EOF')) {
      const label = this.advance().value;
      this.expect('COLON');
      const valTok = this.advance();
      list.push({ label, value: Number(valTok.value) || 0 });
      if (this.match('COMMA')) this.advance();
    }
    this.expect('RPAREN');
    return list;
  }

  /**
   * 映射表 Name 列(c1, c2, c3) {
   *   行 label1: a, b, c
   *   行 label2: d, e, f
   * }
   */
  private parseMappingTable(): MappingTableDeclNode {
    const start = this.advance(); // '映射表'
    const name = this.expect('IDENTIFIER').value;
    this.expect('KEYWORD', '列');
    const columns = this.parseParenList();
    this.expect('LBRACE');
    const rows: Array<{ label: string; items: string[] }> = [];
    while (!this.match('RBRACE') && !this.match('EOF')) {
      this.expect('KEYWORD', '行');
      const label = this.advance().value;
      this.expect('COLON');
      const items: string[] = [];
      while (!this.match('RBRACE') && !this.match('EOF') && !(this.peek().type === 'KEYWORD' && this.peek().value === '行')) {
        items.push(this.advance().value);
        if (this.match('COMMA')) this.advance();
      }
      rows.push({ label, items });
    }
    const end = this.expect('RBRACE');
    return {
      type: 'MappingTableDecl', name, columns, rows,
      source_span: { line_start: start.line, line_end: end.line },
    };
  }

  /** 封口 Name = 555 由 (天罡:36, 地煞:72, ...) */
  private parseClosure(): ClosureDeclNode {
    const start = this.advance(); // '封口'
    const name = this.expect('IDENTIFIER').value;
    this.expect('OPERATOR', '=');
    const totalTok = this.advance();
    const total = Number(totalTok.value) || 0;
    this.expect('KEYWORD', '由');
    const parts = this.parseLabeledParenList();
    return {
      type: 'ClosureDecl', name, total, parts,
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  /** 同位链 Name 域(d1, d2, d3, d4) = (a, b, c, d) */
  private parseCorrespondenceChain(): CorrespondenceChainDeclNode {
    const start = this.advance(); // '同位链'
    const name = this.expect('IDENTIFIER').value;
    this.expect('KEYWORD', '域');
    const domains = this.parseParenList();
    this.expect('OPERATOR', '=');
    const items = this.parseParenList();
    return {
      type: 'CorrespondenceChainDecl', name, domains, items,
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  /**
   * 域展开 Name 母法(无, 天, 元, 公, 太) 域(宇宙, 生灵, 社会, 家庭, 人文) {
   *   五因 宇宙: 形, 数, 色, 力, 影响
   * }
   */
  private parseDomainExpansion(): DomainExpansionDeclNode {
    const start = this.advance(); // '域展开'
    const name = this.expect('IDENTIFIER').value;
    this.expect('KEYWORD', '母法');
    const mother_law_values = this.parseParenList();
    this.expect('KEYWORD', '域');
    const domains = this.parseParenList();
    this.expect('LBRACE');
    const factors: Array<{ domain: string; items: string[] }> = [];
    while (!this.match('RBRACE') && !this.match('EOF')) {
      this.expect('KEYWORD', '五因');
      const domain = this.advance().value;
      this.expect('COLON');
      const items: string[] = [];
      while (!this.match('RBRACE') && !this.match('EOF') && !(this.peek().type === 'KEYWORD' && this.peek().value === '五因')) {
        items.push(this.advance().value);
        if (this.match('COMMA')) this.advance();
      }
      factors.push({ domain, items });
    }
    const end = this.expect('RBRACE');
    return {
      type: 'DomainExpansionDecl', name, mother_law_values, domains, factors,
      source_span: { line_start: start.line, line_end: end.line },
    };
  }

  // ==================== New in 0.5: 主权判断操作系统 ====================

  /**
   * 单元 Name {
   *   层级 = "微观"
   *   模块 = "感知采样"
   *   定义 = "..."
   *   触发 = "..."
   *   价值 = "..."
   *   代价 = "..."
   *   价值分 = 8
   *   代价分 = 6
   * }
   */
  private parseUnit(): UnitDeclNode {
    const start = this.advance(); // '单元'
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');
    const fields: Record<string, unknown> = {};
    while (!this.match('RBRACE') && !this.match('EOF')) {
      const key = this.advance().value;
      this.expect('OPERATOR', '=');
      const tok = this.advance();
      fields[key] = tok.type === 'NUMBER' ? Number(tok.value) : tok.value;
      if (this.match('COMMA')) this.advance();
    }
    const end = this.expect('RBRACE');
    return {
      type: 'UnitDecl', name,
      layer: String(fields['层级'] ?? ''),
      module: String(fields['模块'] ?? ''),
      definition: String(fields['定义'] ?? ''),
      trigger: String(fields['触发'] ?? ''),
      value: String(fields['价值'] ?? ''),
      cost: String(fields['代价'] ?? ''),
      value_score: typeof fields['价值分'] === 'number' ? (fields['价值分'] as number) : 5,
      cost_score: typeof fields['代价分'] === 'number' ? (fields['代价分'] as number) : 5,
      source_span: { line_start: start.line, line_end: end.line },
    };
  }

  /**
   * 编制 Name {
   *   母体 = 3
   *   显性 = 14
   *   隐性 = 10
   *   微观 = 108
   *   总计 = 135
   * }
   */
  private parseEstablishment(): EstablishmentDeclNode {
    const start = this.advance(); // '编制'
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');
    const layers: Record<string, number> = {};
    let total: number | null = null;
    while (!this.match('RBRACE') && !this.match('EOF')) {
      const key = this.advance().value;
      this.expect('OPERATOR', '=');
      const tok = this.advance();
      const v = Number(tok.value) || 0;
      if (key === '总计') total = v;
      else layers[key] = v;
      if (this.match('COMMA')) this.advance();
    }
    const end = this.expect('RBRACE');
    return {
      type: 'EstablishmentDecl', name, layers, total,
      source_span: { line_start: start.line, line_end: end.line },
    };
  }

  /**
   * 档位 Name {
   *   下限 = 20
   *   上限 = 35
   *   描述 = "..."
   * }
   */
  private parseProfile(): ProfileDeclNode {
    const start = this.advance(); // '档位'
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');
    let lower = 0, upper = 0, description = '';
    while (!this.match('RBRACE') && !this.match('EOF')) {
      const t = this.peek();
      if (t.type === 'KEYWORD' && t.value === '下限') {
        this.advance(); this.expect('OPERATOR', '=');
        lower = Number(this.advance().value) || 0;
      } else if (t.type === 'KEYWORD' && t.value === '上限') {
        this.advance(); this.expect('OPERATOR', '=');
        upper = Number(this.advance().value) || 0;
      } else if (this.peek().value === '描述') {
        this.advance(); this.expect('OPERATOR', '=');
        description = this.advance().value;
      } else {
        this.advance();
      }
      if (this.match('COMMA')) this.advance();
    }
    const end = this.expect('RBRACE');
    return {
      type: 'ProfileDecl', name, lower, upper, description,
      source_span: { line_start: start.line, line_end: end.line },
    };
  }

  /**
   * 权衡 Name 单元集(a, b, c) 阈值(价值≥6, 代价≤7)
   * 单元集 可省略表示「全部」；阈值 可省略
   */
  private parseTradeoff(): TradeoffDeclNode {
    const start = this.advance(); // '权衡'
    const name = this.expect('IDENTIFIER').value;
    let units: string[] = [];
    let value_threshold: number | null = null;
    let cost_threshold: number | null = null;

    while (this.peek().type === 'KEYWORD' && (this.peek().value === '单元集' || this.peek().value === '阈值')) {
      const k = this.advance().value;
      if (k === '单元集') {
        units = this.parseParenList();
      } else {
        // 阈值(价值≥6, 代价≤7)
        this.expect('LPAREN');
        while (!this.match('RPAREN') && !this.match('EOF')) {
          const field = this.advance().value;
          const op = this.advance().value;
          const num = Number(this.advance().value) || 0;
          if (field === '价值' && (op === '≥' || op === '>=' || op === '>')) value_threshold = num;
          if (field === '代价' && (op === '≤' || op === '<=' || op === '<')) cost_threshold = num;
          if (this.match('COMMA')) this.advance();
        }
        this.expect('RPAREN');
      }
    }

    return {
      type: 'TradeoffDecl', name, units, value_threshold, cost_threshold,
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  // ==================== New in 0.6: 数字文明母体引擎 ====================

  /** 通用：解析 `隶属 EngineName` */
  private parseEngineRef(): string {
    this.expect('KEYWORD', '隶属');
    return this.expect('IDENTIFIER').value;
  }

  /** 通用：解析 `字段 = 值` 或 `字段 = (a, b, c)` 块 */
  private parseEngineFieldsBlock(): Record<string, unknown> {
    this.expect('LBRACE');
    const out: Record<string, unknown> = {};
    while (!this.match('RBRACE') && !this.match('EOF')) {
      const key = this.advance().value;
      this.expect('OPERATOR', '=');
      if (this.match('LPAREN')) {
        this.advance();
        const list: string[] = [];
        while (!this.match('RPAREN') && !this.match('EOF')) {
          list.push(this.advance().value);
          if (this.match('COMMA')) this.advance();
        }
        this.expect('RPAREN');
        out[key] = list;
      } else {
        const tok = this.advance();
        out[key] = tok.type === 'NUMBER' ? Number(tok.value) : tok.value;
      }
      if (this.match('COMMA')) this.advance();
    }
    this.expect('RBRACE');
    return out;
  }

  private static ENGINE_KIND_MAP: Record<string, EngineKind> = {
    '主体': 'subject',
    '记忆': 'memory',
    '版本': 'version',
    '不变量': 'invariant',
    '动态变量': 'dynamic',
    '逻辑链': 'logic',
  };

  /**
   * 引擎 Name {
   *   类型 = 不变量
   *   定位 = "..."
   *   约束 = "..."
   * }
   */
  private parseEngine(): EngineDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const fields = this.parseEngineFieldsBlock();
    const rawType = String(fields['类型'] ?? '');
    const kind: EngineKind = Parser.ENGINE_KIND_MAP[rawType] ?? 'unknown';
    return {
      type: 'EngineDecl', name, kind,
      position: String(fields['定位'] ?? ''),
      constraint: String(fields['约束'] ?? ''),
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  /**
   * 模块 Name 隶属 EngineName {
   *   职责 = "..."
   *   输入 = (a, b)
   *   输出 = (c)
   * }
   */
  private parseModule(): ModuleDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const engine_ref = this.parseEngineRef();
    const fields = this.parseEngineFieldsBlock();
    return {
      type: 'ModuleDecl', name, engine_ref,
      responsibility: String(fields['职责'] ?? ''),
      inputs: (fields['输入'] as string[]) || [],
      outputs: (fields['输出'] as string[]) || [],
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  /**
   * 动作 Name 隶属 EngineName {
   *   触发 = "..."
   *   前置 = "..."
   *   后置 = "..."
   *   代价 = 3
   * }
   */
  private parseEngineAction(): EngineActionDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const engine_ref = this.parseEngineRef();
    const fields = this.parseEngineFieldsBlock();
    return {
      type: 'EngineActionDecl', name, engine_ref,
      trigger: String(fields['触发'] ?? ''),
      pre: String(fields['前置'] ?? ''),
      post: String(fields['后置'] ?? ''),
      cost: typeof fields['代价'] === 'number' ? (fields['代价'] as number) : 0,
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  /**
   * 轴 Name 隶属 EngineName {
   *   序号 = 1
   *   含义 = "..."
   *   作用 = "..."
   * }
   */
  private parseAxis(): AxisDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const engine_ref = this.parseEngineRef();
    const fields = this.parseEngineFieldsBlock();
    return {
      type: 'AxisDecl', name, engine_ref,
      index: typeof fields['序号'] === 'number' ? (fields['序号'] as number) : 0,
      meaning: String(fields['含义'] ?? ''),
      effect: String(fields['作用'] ?? ''),
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  // ==================== New in 0.7: 概念级 AI 长期记忆块 ====================

  private static CONCEPT_KIND_MAP: Record<string, ConceptBlockKind> = {
    '实体': '实体', '原理': '原理', '状态': '状态', '目标': '目标', '元概念': '元概念',
  };

  /**
   * 概念块 Name {
   *   类型 = 实体
   *   名称 = "可选显示名"
   *   定义 = "..."
   *   核心命题 = (p1, p2)
   *   相邻概念 = (n1, n2)
   *   适用范围 = "..."
   *   失效边界 = "..."
   *   来源 = "..."
   *   置信度 = 0.9
   *   更新时间 = "2025-04-19"
   * }
   */
  private parseConceptBlock(): ConceptBlockDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    // 可选内联 kind 槽位:概念块 名称 [实体|原理|状态|目标|元概念] { ... }
    let inlineKind: string | null = null;
    if (this.peek().type === 'IDENTIFIER') {
      inlineKind = this.advance().value;
    }
    const fields = this.parseEngineFieldsBlock();
    const rawKind = inlineKind ?? String(fields['类型'] ?? '');
    const kind: ConceptBlockKind = Parser.CONCEPT_KIND_MAP[rawKind] ?? '未分类';
    // 把内联 kind 也回填到 fields.类型,使 IR / projection 一致看到 kind
    if (inlineKind && fields['类型'] === undefined) {
      fields['类型'] = inlineKind;
    }
    return {
      type: 'ConceptBlockDecl', name, kind, fields,
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  /**
   * 命题块 Name {
   *   主语 = ConceptName
   *   谓语 = "..."
   *   宾语 = OtherConcept
   *   断言 = "..."
   *   来源 = "..."
   *   置信度 = 0.8
   *   更新时间 = "..."
   * }
   */
  private parsePropositionBlock(): PropositionBlockDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const fields = this.parseEngineFieldsBlock();
    return {
      type: 'PropositionBlockDecl', name, fields,
      source_span: { line_start: start.line, line_end: start.line },
    };
  }

  /**
   * 关系块 Name {
   *   源 = ConceptA
   *   靶 = ConceptB
   *   关系类型 = 因果
   *   强度 = 0.7
   *   来源 = "..."
   *   置信度 = 0.9
   * }
   */
  private parseRelationBlock(): RelationBlockDeclNode {
    const start = this.advance();
    const name = this.expect('IDENTIFIER').value;
    const fields = this.parseEngineFieldsBlock();
    return {
      type: 'RelationBlockDecl', name, fields,
      source_span: { line_start: start.line, line_end: start.line },
    };
  }
}
