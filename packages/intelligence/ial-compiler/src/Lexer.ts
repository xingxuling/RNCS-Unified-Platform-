// THE SEED v2.0 - IAL Lexer
// Lexical Analysis for Imperium Aether Language

/**
 * Token types for IAL
 */
export enum TokenType {
  // Glyphs
  WHITE_GLYPH = 'WHITE_GLYPH',
  BLUE_GLYPH = 'BLUE_GLYPH',
  GOLD_GLYPH = 'GOLD_GLYPH',
  
  // Operators
  ARROW = 'ARROW',           // →
  COLON = 'COLON',           // :
  EQUALS = 'EQUALS',         // =
  
  // Modifiers
  PLUS = 'PLUS',             // +
  MINUS = 'MINUS',           // -
  MULTIPLY = 'MULTIPLY',     // ×
  DIVIDE = 'DIVIDE',         // ÷
  INFINITY = 'INFINITY',     // ∞
  DELTA = 'DELTA',           // Δ
  
  // Structure
  LBRACE = 'LBRACE',         // {
  RBRACE = 'RBRACE',         // }
  LBRACKET = 'LBRACKET',     // [
  RBRACKET = 'RBRACKET',     // ]
  LPAREN = 'LPAREN',         // (
  RPAREN = 'RPAREN',         // )
  
  // Keywords
  CIV = 'CIV',               // CIV block
  MATRIX = 'MATRIX',         // Matrix
  SPELL = 'SPELL',           // Spell
  
  // Identifiers
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  
  // Special
  EOF = 'EOF',
  NEWLINE = 'NEWLINE',
  WHITESPACE = 'WHITESPACE',
  COMMENT = 'COMMENT',
}

/**
 * IAL Token
 */
export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  position: number;
}

/**
 * White Layer Glyphs
 */
const WHITE_GLYPHS = new Set([
  'Æ', 'AE',        // Aether-Origin
  'Ω', 'OMEGA',     // Omega-Core
  'Ψ', 'PSI',       // Psy-Field
  'Λ', 'LAMBDA',    // Lambda-Flow
  'Σ', 'SIGMA',     // Sigma-Unity
  'Φ', 'PHI',       // Phi-Harmonic
  'Θ', 'THETA',     // Theta-Inner
  'Η', 'H', 'ETA',  // Eta-Bridge
  'Ξ', 'XI',        // Xi-Shift
  'ΔΩ', 'DELTA_OMEGA', // Delta-Omega
  'Ō', 'O', 'ORIGIN_LOOP', // Origin-Loop
  'W₁', 'W1', 'WHITE_SEED', // White-Seed
]);

/**
 * Blue Layer Glyphs
 */
const BLUE_GLYPHS = new Set([
  'Γ', 'GAMMA',     // Gamma-Structure
  'Π', 'PI',        // Pi-Constant
  'Χ', 'X', 'CHI',  // Chi-Grid
  'Z', 'ZETA',      // Zeta-Path
  'K', 'KAPPA',     // Kappa-Node
  'T', 'TAU',       // Tau-Frame
  'B₂', 'B2', 'BLUE_BOUND', // Blue-Bound
  'F₁', 'F1', 'FLOW_ONE',   // Flow-One
  'S₄', 'S4', 'SECTOR_FOUR', // Sector-Four
  'R₀', 'R0', 'ROOT',        // Root-Structure
  'NΣ', 'NSIGMA',   // N-Sigma
  'C∞', 'CINF', 'C_INFINITY', // C-Infinity
]);

/**
 * Gold Layer Glyphs
 */
const GOLD_GLYPHS = new Set([
  'I', 'IMPERIUM',  // Imperium-Core
  'D', 'DOMINION',  // Dominion
  'V', 'VECTOR',    // Vector-Force
  'A₊', 'A+', 'ASCEND', // Ascend-Plus
  'Y', 'YIELD',     // Yield-Shift
  'Z₊', 'Z+', 'ZENITH', // Zenith
  'G₁', 'G1', 'GOLD_SOURCE', // Gold-Source
  'MΩ', 'MOMEGA',   // Mega-Omega
  'PΘ', 'PTHETA',   // Power-Theta
  'L₁', 'L1', 'LIGHT_ONE',   // Light-One
  'EΔ', 'EDELTA',   // Energy-Delta
  'K∞', 'KINF', 'KING_INFINITE', // King-Infinite
]);

/**
 * IAL Lexer
 * Tokenizes IAL source code
 */
export class IALLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokenize the source code
   */
  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  /**
   * Scan a single token
   */
  private scanToken(): void {
    const char = this.advance();

    switch (char) {
      case '→':
        this.addToken(TokenType.ARROW, '→');
        break;
      case ':':
        this.addToken(TokenType.COLON, ':');
        break;
      case '=':
        this.addToken(TokenType.EQUALS, '=');
        break;
      case '+':
        this.addToken(TokenType.PLUS, '+');
        break;
      case '-':
        this.addToken(TokenType.MINUS, '-');
        break;
      case '×':
        this.addToken(TokenType.MULTIPLY, '×');
        break;
      case '÷':
        this.addToken(TokenType.DIVIDE, '÷');
        break;
      case '∞':
        this.addToken(TokenType.INFINITY, '∞');
        break;
      case 'Δ':
        this.addToken(TokenType.DELTA, 'Δ');
        break;
      case '{':
        this.addToken(TokenType.LBRACE, '{');
        break;
      case '}':
        this.addToken(TokenType.RBRACE, '}');
        break;
      case '[':
        this.addToken(TokenType.LBRACKET, '[');
        break;
      case ']':
        this.addToken(TokenType.RBRACKET, ']');
        break;
      case '(':
        this.addToken(TokenType.LPAREN, '(');
        break;
      case ')':
        this.addToken(TokenType.RPAREN, ')');
        break;
      case '\n':
        this.line++;
        this.column = 1;
        this.addToken(TokenType.NEWLINE, '\n');
        break;
      case ' ':
      case '\t':
      case '\r':
        // Skip whitespace
        break;
      case '/':
        if (this.match('/')) {
          // Comment
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.DIVIDE, '/');
        }
        break;
      case '"':
      case "'":
        this.string(char);
        break;
      default:
        if (this.isDigit(char)) {
          this.number();
        } else if (this.isAlpha(char) || this.isSpecialChar(char)) {
          this.identifier();
        } else {
          // Unknown character
          this.addToken(TokenType.IDENTIFIER, char);
        }
        break;
    }
  }

  /**
   * Scan identifier or glyph
   */
  private identifier(): void {
    const start = this.position - 1;
    
    while (this.isAlphaNumeric(this.peek()) || this.isSpecialChar(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(start, this.position);
    
    // Check for glyphs
    if (WHITE_GLYPHS.has(text.toUpperCase())) {
      this.addToken(TokenType.WHITE_GLYPH, text);
    } else if (BLUE_GLYPHS.has(text.toUpperCase())) {
      this.addToken(TokenType.BLUE_GLYPH, text);
    } else if (GOLD_GLYPHS.has(text.toUpperCase())) {
      this.addToken(TokenType.GOLD_GLYPH, text);
    } else {
      // Check for keywords
      switch (text.toUpperCase()) {
        case 'CIV':
          this.addToken(TokenType.CIV, text);
          break;
        case 'MATRIX':
          this.addToken(TokenType.MATRIX, text);
          break;
        case 'SPELL':
          this.addToken(TokenType.SPELL, text);
          break;
        default:
          this.addToken(TokenType.IDENTIFIER, text);
          break;
      }
    }
  }

  /**
   * Scan string literal
   */
  private string(quote: string): void {
    const start = this.position;
    
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${this.line}`);
    }

    this.advance(); // Closing quote
    const value = this.source.substring(start, this.position - 1);
    this.addToken(TokenType.STRING, value);
  }

  /**
   * Scan number literal
   */
  private number(): void {
    const start = this.position - 1;
    
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // Consume '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(start, this.position);
    this.addToken(TokenType.NUMBER, value);
  }

  /**
   * Helper methods
   */
  private advance(): string {
    this.position++;
    this.column++;
    return this.source[this.position - 1];
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.position];
  }

  private peekNext(): string {
    if (this.position + 1 >= this.source.length) return '\0';
    return this.source[this.position + 1];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.position] !== expected) return false;
    this.position++;
    this.column++;
    return true;
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isSpecialChar(char: string): boolean {
    // Allow special Unicode characters for glyphs
    return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(char) ||
           ['₁', '₂', '₃', '₄', '₊', '₀', '∞', 'Δ', 'Ω'].includes(char);
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column - value.length,
      position: this.position - value.length,
    });
  }
}

