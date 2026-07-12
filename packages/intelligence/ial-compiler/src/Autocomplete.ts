// THE SEED v2.0 - IAL Autocomplete
// Provides autocomplete suggestions for IAL expressions

import { IALLexer, TokenType } from './Lexer';

/**
 * IAL Autocomplete Provider
 */
export class IALAutocomplete {
  // White layer glyphs
  private whiteGlyphs = [
    'W₁', 'W1', 'WHITE_SEED', 'Æ', 'AE', 'Ω', 'OMEGA', 'Ψ', 'PSI',
    'Λ', 'LAMBDA', 'Σ', 'SIGMA', 'Φ', 'PHI', 'Θ', 'THETA', 'Η', 'H', 'ETA',
    'Ξ', 'XI', 'ΔΩ', 'DELTA_OMEGA', 'Ō', 'O', 'ORIGIN_LOOP'
  ];

  // Blue layer glyphs
  private blueGlyphs = [
    'Γ', 'GAMMA', 'Π', 'PI', 'Χ', 'X', 'CHI', 'Z', 'ZETA', 'K', 'KAPPA',
    'T', 'TAU', 'B₂', 'B2', 'BLUE_BOUND', 'F₁', 'F1', 'FLOW_ONE',
    'S₄', 'S4', 'SECTOR_FOUR', 'R₀', 'R0', 'ROOT', 'NΣ', 'NSIGMA',
    'C∞', 'CINF', 'C_INFINITY'
  ];

  // Gold layer glyphs
  private goldGlyphs = [
    'I', 'IMPERIUM', 'D', 'DOMINION', 'V', 'VECTOR', 'A₊', 'A+', 'ASCEND',
    'Y', 'YIELD', 'Z₊', 'Z+', 'ZENITH', 'G₁', 'G1', 'GOLD_SOURCE',
    'MΩ', 'MOMEGA', 'PΘ', 'PTHETA', 'L₁', 'L1', 'LIGHT_ONE',
    'EΔ', 'EDELTA', 'K∞', 'KINF', 'KING_INFINITE'
  ];

  // Operators
  private operators = [':', '→', '=', '|', '&', '!', '?'];

  // Modifiers
  private modifiers = ['+', '-', '×', '÷', '∞', 'Δ', '↑', '↓', '↔'];

  // Keywords
  private keywords = ['CIV', 'MATRIX', 'SPELL', 'IF', 'THEN', 'ELSE', 'WHILE', 'FOR'];

  /**
   * Get all available symbols
   */
  private getAllSymbols(): string[] {
    return [
      ...this.whiteGlyphs,
      ...this.blueGlyphs,
      ...this.goldGlyphs,
      ...this.operators,
      ...this.modifiers,
      ...this.keywords,
    ];
  }

  /**
   * Get suggestions based on current input
   */
  getSuggestions(input: string, cursorPosition: number): {
    suggestions: string[];
    startPosition: number;
    endPosition: number;
  } {
    // Extract current word
    const beforeCursor = input.substring(0, cursorPosition);
    const afterCursor = input.substring(cursorPosition);
    
    // Find word boundaries
    const wordMatch = beforeCursor.match(/([\w₁₂₃₄₊∞ΔΩΘΣΦΨΛΞΓΠΧΖΚΤΒ₀₊₋×÷↑↓↔→:=\|&!?]+)$/);
    if (!wordMatch) {
      return { suggestions: [], startPosition: cursorPosition, endPosition: cursorPosition };
    }

    const currentWord = wordMatch[0];
    const startPosition = cursorPosition - currentWord.length;
    const endPosition = cursorPosition;

    // Filter suggestions
    const allSymbols = this.getAllSymbols();
    const filtered = allSymbols.filter(symbol => 
      symbol.toLowerCase().startsWith(currentWord.toLowerCase()) ||
      symbol.toLowerCase().includes(currentWord.toLowerCase())
    );

    // Sort by relevance (exact match first, then by length)
    const sorted = filtered.sort((a, b) => {
      const aExact = a.toLowerCase().startsWith(currentWord.toLowerCase());
      const bExact = b.toLowerCase().startsWith(currentWord.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.length - b.length;
    });

    return {
      suggestions: sorted.slice(0, 10), // Limit to 10 suggestions
      startPosition,
      endPosition,
    };
  }

  /**
   * Get context-aware suggestions
   */
  getContextualSuggestions(input: string, cursorPosition: number): string[] {
    const beforeCursor = input.substring(0, cursorPosition);
    const lastChar = beforeCursor[beforeCursor.length - 1];

    // After operator, suggest glyphs
    if ([':', '→', '='].includes(lastChar)) {
      return [
        ...this.whiteGlyphs.slice(0, 5),
        ...this.blueGlyphs.slice(0, 5),
        ...this.goldGlyphs.slice(0, 5),
      ];
    }

    // After glyph, suggest operators or modifiers
    if (this.getAllSymbols().some(s => beforeCursor.endsWith(s))) {
      return [...this.operators, ...this.modifiers];
    }

    // Default: all symbols
    return this.getAllSymbols().slice(0, 20);
  }

  /**
   * Get layer-specific suggestions
   */
  getLayerSuggestions(layer: 'white' | 'blue' | 'gold'): string[] {
    switch (layer) {
      case 'white':
        return this.whiteGlyphs;
      case 'blue':
        return this.blueGlyphs;
      case 'gold':
        return this.goldGlyphs;
      default:
        return [];
    }
  }

  /**
   * Validate and suggest corrections
   */
  validateAndSuggest(input: string): {
    isValid: boolean;
    suggestions: string[];
    errors: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    try {
      const lexer = new IALLexer(input);
      const tokens = lexer.tokenize();
      
      // Check for tokens that might need suggestions
      tokens.forEach(token => {
        if (token.type === TokenType.IDENTIFIER) {
          const allSymbols = this.getAllSymbols();
          if (!allSymbols.includes(token.value)) {
            const similar = this.findSimilar(token.value);
            if (similar.length > 0) {
              suggestions.push(...similar);
            }
          }
        }
      });

      return {
        isValid: errors.length === 0,
        suggestions: [...new Set(suggestions)],
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        suggestions: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Find similar symbols (fuzzy matching)
   */
  private findSimilar(input: string): string[] {
    const allSymbols = this.getAllSymbols();
    const inputLower = input.toLowerCase();

    return allSymbols
      .map(symbol => ({
        symbol,
        score: this.calculateSimilarity(inputLower, symbol.toLowerCase()),
      }))
      .filter(item => item.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.symbol);
  }

  /**
   * Calculate similarity score (simple Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

