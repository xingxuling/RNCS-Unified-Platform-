// THE SEED v2.0 - IAL Semantic Analyzer
// Semantic Analysis for Imperium Aether Language

import { ASTNode, ASTNodeType, ExpressionNode, GlyphNode, ProgramNode } from './Parser';

/**
 * Semantic Error
 */
export class SemanticError extends Error {
  constructor(
    message: string,
    public node: ASTNode
  ) {
    super(message);
    this.name = 'SemanticError';
  }
}

/**
 * Type information
 */
export interface TypeInfo {
  layer: 'white' | 'blue' | 'gold';
  glyph: string;
  valid: boolean;
  errors: string[];
}

/**
 * Semantic Analysis Result
 */
export interface SemanticResult {
  valid: boolean;
  errors: SemanticError[];
  warnings: string[];
  typeInfo: Map<ASTNode, TypeInfo>;
}

/**
 * IAL Semantic Analyzer
 * Validates AST semantics
 */
export class IALSemanticAnalyzer {
  private errors: SemanticError[] = [];
  private warnings: string[] = [];
  private typeInfo: Map<ASTNode, TypeInfo> = new Map();

  /**
   * Analyze program
   */
  analyze(program: ProgramNode): SemanticResult {
    this.errors = [];
    this.warnings = [];
    this.typeInfo.clear();

    // Analyze all statements
    for (const statement of program.statements) {
      this.analyzeStatement(statement);
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      typeInfo: this.typeInfo,
    };
  }

  /**
   * Analyze a statement
   */
  private analyzeStatement(node: ASTNode): void {
    switch (node.type) {
      case ASTNodeType.EXPRESSION:
        this.analyzeExpression(node as ExpressionNode);
        break;
      case ASTNodeType.SPELL:
        // Analyze spell expressions
        break;
      case ASTNodeType.MATRIX:
        // Analyze matrix sections
        break;
      case ASTNodeType.CIV_BLOCK:
        // Analyze CIV block statements
        break;
    }
  }

  /**
   * Analyze an expression
   * Validates layer propagation: White → Blue → Gold
   */
  private analyzeExpression(node: ExpressionNode): void {
    // Validate White layer
    if (node.white) {
      const whiteInfo = this.analyzeGlyph(node.white);
      this.typeInfo.set(node.white, whiteInfo);
      
      if (!whiteInfo.valid) {
        this.errors.push(
          new SemanticError(`Invalid White glyph: ${node.white.value}`, node.white)
        );
      }
    }

    // Validate Blue layer (required)
    if (node.blue.glyphs.length === 0) {
      this.errors.push(
        new SemanticError('Expression must have at least one Blue glyph', node)
      );
      return;
    }

    for (const blueGlyph of node.blue.glyphs) {
      const blueInfo = this.analyzeGlyph(blueGlyph);
      this.typeInfo.set(blueGlyph, blueInfo);
      
      if (!blueInfo.valid) {
        this.errors.push(
          new SemanticError(`Invalid Blue glyph: ${blueGlyph.value}`, blueGlyph)
        );
      }
    }

    // Validate Gold layer (optional)
    if (node.gold) {
      const goldInfo = this.analyzeGlyph(node.gold);
      this.typeInfo.set(node.gold, goldInfo);
      
      if (!goldInfo.valid) {
        this.errors.push(
          new SemanticError(`Invalid Gold glyph: ${node.gold.value}`, node.gold)
        );
      }
    }

    // Validate layer propagation
    this.validateLayerPropagation(node);
  }

  /**
   * Analyze a glyph
   */
  private analyzeGlyph(node: GlyphNode): TypeInfo {
    const errors: string[] = [];
    let valid = true;

    // Validate glyph value
    if (!this.isValidGlyph(node.layer, node.value)) {
      errors.push(`Invalid ${node.layer} glyph: ${node.value}`);
      valid = false;
    }

    // Validate modifiers
    for (const modifier of node.modifiers) {
      if (!this.isValidModifier(modifier.operator)) {
        errors.push(`Invalid modifier: ${modifier.operator}`);
        valid = false;
      }
    }

    return {
      layer: node.layer,
      glyph: node.value,
      valid,
      errors,
    };
  }

  /**
   * Validate layer propagation
   * Rule: White → Blue → Gold
   */
  private validateLayerPropagation(node: ExpressionNode): void {
    // Check if White is followed by Blue
    if (node.white && node.blue.glyphs.length === 0) {
      this.errors.push(
        new SemanticError('White glyph must be followed by Blue glyphs', node)
      );
    }

    // Check if Blue is followed by Gold (if Gold exists)
    if (node.blue.glyphs.length > 0 && node.gold) {
      // Valid: Blue → Gold
    } else if (node.blue.glyphs.length === 0 && node.gold) {
      this.errors.push(
        new SemanticError('Gold glyph must be preceded by Blue glyphs', node)
      );
    }

    // Special cases: ΔΩ and MΩ can reset sequence
    const hasResetGlyph = 
      node.white?.value === 'ΔΩ' ||
      node.white?.value === 'MΩ' ||
      node.blue.glyphs.some(g => g.value === 'ΔΩ' || g.value === 'MΩ') ||
      node.gold?.value === 'MΩ';

    if (hasResetGlyph) {
      // Reset glyphs allow sequence reset
      return;
    }
  }

  /**
   * Check if glyph is valid for layer
   */
  private isValidGlyph(layer: 'white' | 'blue' | 'gold', value: string): boolean {
    // This would check against the actual glyph definitions
    // For now, we assume all parsed glyphs are valid
    return true;
  }

  /**
   * Check if modifier is valid
   */
  private isValidModifier(operator: string): boolean {
    const validModifiers = ['+', '-', '×', '÷', '∞', 'Δ'];
    return validModifiers.includes(operator);
  }
}

