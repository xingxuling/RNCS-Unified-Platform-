// THE SEED v2.0 - IAL Parser
// Syntax Analysis for Imperium Aether Language

import { Token, TokenType, IALLexer } from './Lexer';

/**
 * AST Node Types
 */
export enum ASTNodeType {
  PROGRAM = 'PROGRAM',
  EXPRESSION = 'EXPRESSION',
  SPELL = 'SPELL',
  MATRIX = 'MATRIX',
  CIV_BLOCK = 'CIV_BLOCK',
  GLYPH_SEQUENCE = 'GLYPH_SEQUENCE',
  GLYPH = 'GLYPH',
  MODIFIER = 'MODIFIER',
}

/**
 * Base AST Node
 */
export interface ASTNode {
  type: ASTNodeType;
  position: {
    line: number;
    column: number;
  };
}

/**
 * Program Node
 */
export interface ProgramNode extends ASTNode {
  type: ASTNodeType.PROGRAM;
  statements: StatementNode[];
}

/**
 * Statement Node
 */
export type StatementNode = 
  | ExpressionNode
  | SpellNode
  | MatrixNode
  | CIVBlockNode;

/**
 * Expression Node
 */
export interface ExpressionNode extends ASTNode {
  type: ASTNodeType.EXPRESSION;
  white?: GlyphNode;
  blue: GlyphSequenceNode;
  gold?: GlyphNode;
}

/**
 * Spell Node
 */
export interface SpellNode extends ASTNode {
  type: ASTNodeType.SPELL;
  expressions: ExpressionNode[];
}

/**
 * Matrix Node
 */
export interface MatrixNode extends ASTNode {
  type: ASTNodeType.MATRIX;
  sections: {
    origin?: GlyphSequenceNode;
    fate?: GlyphSequenceNode;
    structure?: GlyphSequenceNode;
    authority?: GlyphSequenceNode;
    ascension?: GlyphSequenceNode;
  };
}

/**
 * CIV Block Node
 */
export interface CIVBlockNode extends ASTNode {
  type: ASTNodeType.CIV_BLOCK;
  statements: StatementNode[];
}

/**
 * Glyph Sequence Node
 */
export interface GlyphSequenceNode extends ASTNode {
  type: ASTNodeType.GLYPH_SEQUENCE;
  glyphs: GlyphNode[];
}

/**
 * Glyph Node
 */
export interface GlyphNode extends ASTNode {
  type: ASTNodeType.GLYPH;
  layer: 'white' | 'blue' | 'gold';
  value: string;
  modifiers: ModifierNode[];
}

/**
 * Modifier Node
 */
export interface ModifierNode extends ASTNode {
  type: ASTNodeType.MODIFIER;
  operator: string;
  value?: string | number;
}

/**
 * IAL Parser
 * Parses tokens into AST
 */
export class IALParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse tokens into AST
   */
  parse(): ProgramNode {
    const statements: StatementNode[] = [];

    while (!this.isAtEnd()) {
      statements.push(this.parseStatement());
    }

    return {
      type: ASTNodeType.PROGRAM,
      statements,
      position: { line: 1, column: 1 },
    };
  }

  /**
   * Parse a statement
   */
  private parseStatement(): StatementNode {
    if (this.match(TokenType.CIV)) {
      return this.parseCIVBlock();
    }
    
    if (this.match(TokenType.MATRIX)) {
      return this.parseMatrix();
    }
    
    if (this.match(TokenType.SPELL)) {
      return this.parseSpell();
    }

    return this.parseExpression();
  }

  /**
   * Parse an expression
   * Expression := White? : Blue+ : Gold?
   */
  private parseExpression(): ExpressionNode {
    const startLine = this.peek().line;
    const startColumn = this.peek().column;

    // Parse White layer (optional)
    let white: GlyphNode | undefined;
    if (this.checkGlyph('white')) {
      white = this.parseGlyph('white');
    }

    // Expect colon
    if (white && !this.match(TokenType.COLON)) {
      throw this.error('Expected ":" after White glyph');
    }

    // Parse Blue layer (required)
    const blue = this.parseGlyphSequence('blue');
    if (blue.glyphs.length === 0) {
      throw this.error('Expected at least one Blue glyph');
    }

    // Optional colon and Gold layer
    let gold: GlyphNode | undefined;
    if (this.match(TokenType.COLON)) {
      if (this.checkGlyph('gold')) {
        gold = this.parseGlyph('gold');
      } else {
        throw this.error('Expected Gold glyph after ":"');
      }
    }

    return {
      type: ASTNodeType.EXPRESSION,
      white,
      blue,
      gold,
      position: { line: startLine, column: startColumn },
    };
  }

  /**
   * Parse a spell
   * Spell := SPELL Expression+
   */
  private parseSpell(): SpellNode {
    const startLine = this.peek().line;
    const startColumn = this.peek().column;

    const expressions: ExpressionNode[] = [];
    
    while (!this.isAtEnd() && !this.check(TokenType.CIV) && !this.check(TokenType.MATRIX)) {
      expressions.push(this.parseExpression());
    }

    return {
      type: ASTNodeType.SPELL,
      expressions,
      position: { line: startLine, column: startColumn },
    };
  }

  /**
   * Parse a matrix
   * Matrix := MATRIX { sections }
   */
  private parseMatrix(): MatrixNode {
    const startLine = this.peek().line;
    const startColumn = this.peek().column;

    if (!this.match(TokenType.LBRACE)) {
      throw this.error('Expected "{" after MATRIX');
    }

    const sections: MatrixNode['sections'] = {};

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const key = this.consume(TokenType.IDENTIFIER, 'Expected section name');
      
      if (!this.match(TokenType.COLON)) {
        throw this.error('Expected ":" after section name');
      }

      const sequence = this.parseGlyphSequence('any');

      switch (key.value.toUpperCase()) {
        case 'ORIGIN':
          sections.origin = sequence;
          break;
        case 'FATE':
          sections.fate = sequence;
          break;
        case 'STRUCTURE':
          sections.structure = sequence;
          break;
        case 'AUTHORITY':
          sections.authority = sequence;
          break;
        case 'ASCENSION':
          sections.ascension = sequence;
          break;
        default:
          throw this.error(`Unknown matrix section: ${key.value}`);
      }

      // Optional comma
      if (this.check(TokenType.IDENTIFIER)) {
        // Next section
      } else if (!this.check(TokenType.RBRACE)) {
        throw this.error('Expected "}" or next section');
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}" after matrix sections');

    return {
      type: ASTNodeType.MATRIX,
      sections,
      position: { line: startLine, column: startColumn },
    };
  }

  /**
   * Parse a CIV block
   * CIV := CIV { statements }
   */
  private parseCIVBlock(): CIVBlockNode {
    const startLine = this.peek().line;
    const startColumn = this.peek().column;

    if (!this.match(TokenType.LBRACE)) {
      throw this.error('Expected "{" after CIV');
    }

    const statements: StatementNode[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      statements.push(this.parseStatement());
    }

    this.consume(TokenType.RBRACE, 'Expected "}" after CIV block');

    return {
      type: ASTNodeType.CIV_BLOCK,
      statements,
      position: { line: startLine, column: startColumn },
    };
  }

  /**
   * Parse a glyph sequence
   */
  private parseGlyphSequence(layer: 'white' | 'blue' | 'gold' | 'any'): GlyphSequenceNode {
    const startLine = this.peek().line;
    const startColumn = this.peek().column;

    const glyphs: GlyphNode[] = [];

    while (this.checkGlyph(layer)) {
      glyphs.push(this.parseGlyph(layer));
    }

    return {
      type: ASTNodeType.GLYPH_SEQUENCE,
      glyphs,
      position: { line: startLine, column: startColumn },
    };
  }

  /**
   * Parse a single glyph
   */
  private parseGlyph(layer: 'white' | 'blue' | 'gold' | 'any'): GlyphNode {
    const token = this.peek();
    
    let detectedLayer: 'white' | 'blue' | 'gold';
    
    if (token.type === TokenType.WHITE_GLYPH) {
      detectedLayer = 'white';
    } else if (token.type === TokenType.BLUE_GLYPH) {
      detectedLayer = 'blue';
    } else if (token.type === TokenType.GOLD_GLYPH) {
      detectedLayer = 'gold';
    } else {
      throw this.error(`Expected ${layer} glyph, got ${token.type}`);
    }

    if (layer !== 'any' && detectedLayer !== layer) {
      throw this.error(`Expected ${layer} glyph, got ${detectedLayer}`);
    }

    this.advance();
    const value = token.value;

    // Parse modifiers
    const modifiers: ModifierNode[] = [];
    while (this.isModifier()) {
      modifiers.push(this.parseModifier());
    }

    return {
      type: ASTNodeType.GLYPH,
      layer: detectedLayer,
      value,
      modifiers,
      position: { line: token.line, column: token.column },
    };
  }

  /**
   * Parse a modifier
   */
  private parseModifier(): ModifierNode {
    const token = this.peek();
    this.advance();

    let value: string | number | undefined;
    
    if (this.check(TokenType.NUMBER)) {
      const numToken = this.advance();
      value = parseFloat(numToken.value);
    } else if (this.check(TokenType.STRING)) {
      const strToken = this.advance();
      value = strToken.value;
    }

    return {
      type: ASTNodeType.MODIFIER,
      operator: token.value,
      value,
      position: { line: token.line, column: token.column },
    };
  }

  /**
   * Check if current token is a glyph of specified layer
   */
  private checkGlyph(layer: 'white' | 'blue' | 'gold' | 'any'): boolean {
    if (this.isAtEnd()) return false;
    
    const token = this.peek();
    
    if (layer === 'any') {
      return token.type === TokenType.WHITE_GLYPH ||
             token.type === TokenType.BLUE_GLYPH ||
             token.type === TokenType.GOLD_GLYPH;
    }
    
    const expectedType = 
      layer === 'white' ? TokenType.WHITE_GLYPH :
      layer === 'blue' ? TokenType.BLUE_GLYPH :
      TokenType.GOLD_GLYPH;
    
    return token.type === expectedType;
  }

  /**
   * Check if current token is a modifier
   */
  private isModifier(): boolean {
    if (this.isAtEnd()) return false;
    
    const token = this.peek();
    return token.type === TokenType.PLUS ||
           token.type === TokenType.MINUS ||
           token.type === TokenType.MULTIPLY ||
           token.type === TokenType.DIVIDE ||
           token.type === TokenType.INFINITY ||
           token.type === TokenType.DELTA;
  }

  /**
   * Helper methods
   */
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(message);
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private error(message: string): Error {
    const token = this.peek();
    return new Error(`[Line ${token.line}, Column ${token.column}] ${message}`);
  }
}

