// THE SEED v2.0 - IAL Compiler
// Complete IAL Compilation Pipeline

import { IALLexer } from './Lexer';
import { IALParser } from './Parser';
import { IALSemanticAnalyzer, SemanticError } from './SemanticAnalyzer';
import { IALCodeGenerator, CompiledIAL } from './CodeGenerator';
import { ProgramNode } from './Parser';
import { IALErrorHandler, EnhancedError } from './ErrorHandler';
import { IALCache } from './Cache';

/**
 * Compilation Result
 */
export interface CompilationResult {
  success: boolean;
  compiled?: CompiledIAL[];
  ast?: ProgramNode;
  errors: Error[];
  enhancedErrors?: EnhancedError[];
  warnings: string[];
}

/**
 * IAL Compiler
 * Complete compilation pipeline: Lex → Parse → Analyze → Generate
 */
export class IALCompiler {
  private lexer: IALLexer;
  private parser: IALParser;
  private semanticAnalyzer: IALSemanticAnalyzer;
  private codeGenerator: IALCodeGenerator;
  private errorHandler: IALErrorHandler;
  private cache: IALCache;

  constructor() {
    this.semanticAnalyzer = new IALSemanticAnalyzer();
    this.codeGenerator = new IALCodeGenerator();
    this.errorHandler = new IALErrorHandler();
    this.cache = new IALCache();
  }

  /**
   * Compile IAL source code
   */
  compile(source: string, useCache: boolean = true): CompilationResult {
    // Check cache
    if (useCache) {
      const cached = this.cache.get(source);
      if (cached) {
        return cached;
      }
    }

    const errors: Error[] = [];
    const enhancedErrors: EnhancedError[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Lexical Analysis
      this.lexer = new IALLexer(source);
      const tokens = this.lexer.tokenize();

      // Step 2: Syntax Analysis
      this.parser = new IALParser(tokens);
      const ast = this.parser.parse();

      // Step 3: Semantic Analysis
      const semanticResult = this.semanticAnalyzer.analyze(ast);

      // Collect semantic errors
      errors.push(...semanticResult.errors);
      warnings.push(...semanticResult.warnings);

      // Enhance errors
      for (const error of errors) {
        const enhanced = this.errorHandler.enhanceError(error, source);
        enhancedErrors.push(enhanced);
      }

      // Step 4: Code Generation
      let result: CompilationResult;
      
      if (semanticResult.valid) {
        const compiled = this.codeGenerator.generate(ast, semanticResult);

        result = {
          success: true,
          compiled,
          ast,
          errors,
          enhancedErrors,
          warnings,
        };
      } else {
        result = {
          success: false,
          ast,
          errors,
          enhancedErrors,
          warnings,
        };
      }

      // Cache successful compilations
      if (useCache && result.success) {
        this.cache.set(source, result);
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);
      const enhanced = this.errorHandler.enhanceError(err, source);
      enhancedErrors.push(enhanced);
      
      return {
        success: false,
        errors,
        enhancedErrors,
        warnings,
      };
    }
  }

  /**
   * Validate IAL expression (quick check)
   */
  validate(source: string): { valid: boolean; errors: string[] } {
    const result = this.compile(source);
    return {
      valid: result.success,
      errors: result.errors.map(e => e.message),
    };
  }

  /**
   * Compile and optimize
   */
  compileAndOptimize(source: string): CompilationResult {
    const result = this.compile(source);
    
    if (result.success && result.compiled) {
      // Apply optimizations
      result.compiled = result.compiled.map(compiled => this.optimize(compiled));
    }

    return result;
  }

  /**
   * Optimize compiled IAL
   */
  private optimize(compiled: CompiledIAL): CompiledIAL {
    // Remove duplicate glyphs
    const uniqueGlyphs = Array.from(new Set(compiled.glyphs));
    
    // Remove duplicate modifiers
    const uniqueModifiers = Array.from(new Set(compiled.modifiers));

    return {
      ...compiled,
      glyphs: uniqueGlyphs,
      modifiers: uniqueModifiers,
    };
  }
}

/**
 * Global compiler instance
 */
export const ialCompiler = new IALCompiler();

