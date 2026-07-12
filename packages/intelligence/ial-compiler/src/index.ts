// THE SEED v2.0 - IAL Module
// Imperium Aether Language - Public API

export { IALLexer } from './Lexer';
export type { Token } from './Lexer';
export { TokenType } from './Lexer';
export { IALParser } from './Parser';
export type { ASTNode, ProgramNode, ExpressionNode } from './Parser';
export { ASTNodeType } from './Parser';
export { IALSemanticAnalyzer } from './SemanticAnalyzer';
export type { SemanticError } from './SemanticAnalyzer';
export { IALErrorHandler } from './ErrorHandler';
export type { EnhancedError } from './ErrorHandler';
export { ErrorSeverity } from './ErrorHandler';
export { IALCodeGenerator } from './CodeGenerator';
export type { CompiledIAL } from './CodeGenerator';
export { IALCompiler } from './Compiler';
export type { CompilationResult } from './Compiler';

// Create compiler instance
import { IALCompiler } from './Compiler';
const ialCompiler = new IALCompiler();

/**
 * Compile IAL expression (convenience function)
 */
export function compileIAL(source: string) {
  return ialCompiler.compile(source);
}

/**
 * Validate IAL expression (convenience function)
 */
export function validateIAL(source: string) {
  return ialCompiler.validate(source);
}

