// THE SEED v2.0 - IAL Code Generator
// Code Generation for Imperium Aether Language

import { ASTNode, ASTNodeType, ExpressionNode, GlyphNode, ProgramNode } from './Parser';
import { SemanticResult } from './SemanticAnalyzer';

/**
 * Compiled IAL
 */
export interface CompiledIAL {
  domain: 'white' | 'blue' | 'gold';
  operation: string;
  glyphs: string[];
  modifiers: string[];
  parameters: Record<string, any>;
  target: 'universe' | 'world' | 'agent' | 'rule' | 'fate';
  oseMapping?: {
    whiteContext?: string;
    blueStructure?: any;
    goldExecution?: any;
  };
}

/**
 * IAL Code Generator
 * Generates runtime code from AST
 */
export class IALCodeGenerator {
  /**
   * Generate compiled IAL from AST
   */
  generate(program: ProgramNode, semanticResult: SemanticResult): CompiledIAL[] {
    const compiled: CompiledIAL[] = [];

    for (const statement of program.statements) {
      if (statement.type === ASTNodeType.EXPRESSION) {
        compiled.push(this.generateExpression(statement as ExpressionNode));
      }
    }

    return compiled;
  }

  /**
   * Generate code for an expression
   */
  private generateExpression(node: ExpressionNode): CompiledIAL {
    const glyphs: string[] = [];
    const modifiers: string[] = [];

    // Collect White glyphs
    if (node.white) {
      glyphs.push(node.white.value);
      node.white.modifiers.forEach(m => modifiers.push(m.operator));
    }

    // Collect Blue glyphs
    node.blue.glyphs.forEach(g => {
      glyphs.push(g.value);
      g.modifiers.forEach(m => modifiers.push(m.operator));
    });

    // Collect Gold glyphs
    if (node.gold) {
      glyphs.push(node.gold.value);
      node.gold.modifiers.forEach(m => modifiers.push(m.operator));
    }

    // Determine domain (primary layer)
    let domain: 'white' | 'blue' | 'gold' = 'blue';
    if (node.gold) {
      domain = 'gold';
    } else if (node.white) {
      domain = 'white';
    }

    // Determine operation
    const operation = this.determineOperation(node);

    // Determine target
    const target = this.determineTarget(node);

    // Generate parameters
    const parameters = this.generateParameters(node);

    // Generate OSE mapping
    const oseMapping = this.generateOSEMapping(node);

    return {
      domain,
      operation,
      glyphs,
      modifiers,
      parameters,
      target,
      oseMapping,
    };
  }

  /**
   * Determine operation from expression
   */
  private determineOperation(node: ExpressionNode): string {
    // Primary operation comes from Gold layer, fallback to Blue, then White
    if (node.gold) {
      return this.glyphToOperation(node.gold.value, 'gold');
    }
    
    if (node.blue.glyphs.length > 0) {
      return this.glyphToOperation(node.blue.glyphs[0].value, 'blue');
    }
    
    if (node.white) {
      return this.glyphToOperation(node.white.value, 'white');
    }

    return 'unknown';
  }

  /**
   * Convert glyph to operation name
   */
  private glyphToOperation(glyph: string, layer: 'white' | 'blue' | 'gold'): string {
    // Map glyphs to operations
    const operationMap: Record<string, string> = {
      // White
      'W₁': 'create_universe',
      'Æ': 'init_origin',
      'Ω': 'complete',
      'Ψ': 'activate_consciousness',
      'Λ': 'access_subconscious',
      'Σ': 'integrate',
      'Φ': 'harmonize',
      'Θ': 'access_deep_will',
      'Η': 'bridge',
      'Ξ': 'shift',
      'ΔΩ': 'reset',
      'Ō': 'loop',
      
      // Blue
      'Γ': 'create_structure',
      'Π': 'define_constant',
      'Χ': 'create_grid',
      'Z': 'define_path',
      'K': 'connect_nodes',
      'T': 'create_frame',
      'B₂': 'set_boundary',
      'F₁': 'create_flow',
      'S₄': 'divide_sectors',
      'R₀': 'create_root',
      'NΣ': 'add_complexity',
      'C∞': 'create_infinite',
      
      // Gold
      'I': 'assert_authority',
      'D': 'establish_dominion',
      'V': 'apply_force',
      'A₊': 'ascend',
      'Y': 'yield',
      'Z₊': 'reach_zenith',
      'G₁': 'access_power',
      'MΩ': 'complete_ultimate',
      'PΘ': 'activate_power',
      'L₁': 'illuminate',
      'EΔ': 'release_energy',
      'K∞': 'establish_infinite_authority',
    };

    return operationMap[glyph] || `${layer}_operation`;
  }

  /**
   * Determine target entity type
   */
  private determineTarget(node: ExpressionNode): CompiledIAL['target'] {
    // Heuristic: determine target from glyphs
    if (node.white?.value === 'W₁') {
      return 'universe';
    }
    
    if (node.blue.glyphs.some(g => ['Γ', 'Π', 'Χ'].includes(g.value))) {
      return 'world';
    }
    
    if (node.white?.value === 'Ψ') {
      return 'agent';
    }
    
    if (node.gold?.value === 'I') {
      return 'rule';
    }
    
    if (node.white?.value === 'ΔΩ') {
      return 'fate';
    }

    return 'world'; // Default
  }

  /**
   * Generate parameters from expression
   */
  private generateParameters(node: ExpressionNode): Record<string, any> {
    const parameters: Record<string, any> = {};

    // Extract parameters from modifiers
    if (node.white) {
      node.white.modifiers.forEach(m => {
        if (m.value !== undefined) {
          parameters[`white_${m.operator}`] = m.value;
        }
      });
    }

    node.blue.glyphs.forEach((g, i) => {
      g.modifiers.forEach(m => {
        if (m.value !== undefined) {
          parameters[`blue_${i}_${m.operator}`] = m.value;
        }
      });
    });

    if (node.gold) {
      node.gold.modifiers.forEach(m => {
        if (m.value !== undefined) {
          parameters[`gold_${m.operator}`] = m.value;
        }
      });
    }

    return parameters;
  }

  /**
   * Generate OSE mapping
   */
  private generateOSEMapping(node: ExpressionNode): CompiledIAL['oseMapping'] {
    return {
      whiteContext: node.white ? this.glyphToOSEContext(node.white.value) : undefined,
      blueStructure: node.blue.glyphs.map(g => this.glyphToOSEStructure(g.value)),
      goldExecution: node.gold ? this.glyphToOSEExecution(node.gold.value) : undefined,
    };
  }

  /**
   * Convert glyph to OSE White context
   */
  private glyphToOSEContext(glyph: string): string {
    const contextMap: Record<string, string> = {
      'W₁': 'universe_creation',
      'Æ': 'origin_initialization',
      'Ψ': 'consciousness_activation',
      'Λ': 'subconscious_access',
      'Σ': 'consciousness_integration',
    };
    return contextMap[glyph] || 'default_context';
  }

  /**
   * Convert glyph to OSE Blue structure
   */
  private glyphToOSEStructure(glyph: string): any {
    return {
      type: 'structure_node',
      glyph,
      operation: this.glyphToOperation(glyph, 'blue'),
    };
  }

  /**
   * Convert glyph to OSE Gold execution
   */
  private glyphToOSEExecution(glyph: string): any {
    return {
      type: 'execution_plan',
      glyph,
      operation: this.glyphToOperation(glyph, 'gold'),
      convergence: 0.5, // Default, will be calculated by OSE
    };
  }
}

