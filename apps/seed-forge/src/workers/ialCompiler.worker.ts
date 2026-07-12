// THE SEED v2.0 - IAL Compiler Web Worker
// Parallel IAL compilation in Web Worker

import { IALLexer } from '../lib/ial/Lexer';
import { IALParser } from '../lib/ial/Parser';
import { IALSemanticAnalyzer } from '../lib/ial/SemanticAnalyzer';
import { IALCodeGenerator } from '../lib/ial/CodeGenerator';
import { IALErrorHandler } from '../lib/ial/ErrorHandler';

/**
 * Worker Message Types
 */
interface CompileMessage {
  type: 'compile';
  id: string;
  source: string;
}

interface CompileResult {
  type: 'result';
  id: string;
  success: boolean;
  compiled?: any;
  ast?: any;
  errors?: any[];
  enhancedErrors?: any[];
  warnings?: string[];
}

/**
 * IAL Compiler Worker
 */
self.onmessage = (event: MessageEvent<CompileMessage>) => {
  const { type, id, source } = event.data;

  if (type === 'compile') {
    try {
      // Step 1: Lexical Analysis
      const lexer = new IALLexer(source);
      const tokens = lexer.tokenize();

      // Step 2: Syntax Analysis
      const parser = new IALParser(tokens);
      const ast = parser.parse();

      // Step 3: Semantic Analysis
      const semanticAnalyzer = new IALSemanticAnalyzer();
      const semanticResult = semanticAnalyzer.analyze(ast);

      // Step 4: Code Generation
      let result: CompileResult;
      
      if (semanticResult.valid) {
        const codeGenerator = new IALCodeGenerator();
        const compiled = codeGenerator.generate(ast, semanticResult);

        result = {
          type: 'result',
          id,
          success: true,
          compiled,
          ast: JSON.parse(JSON.stringify(ast)), // Serialize AST
          errors: [],
          warnings: semanticResult.warnings,
        };
      } else {
        const errorHandler = new IALErrorHandler();
        const enhancedErrors = semanticResult.errors.map(err => 
          errorHandler.enhanceError(err, source)
        );

        result = {
          type: 'result',
          id,
          success: false,
          ast: JSON.parse(JSON.stringify(ast)),
          errors: semanticResult.errors.map(e => ({
            message: e.message,
            node: e.node,
          })),
          enhancedErrors: enhancedErrors.map(e => ({
            severity: e.severity,
            message: e.message,
            code: e.code,
            position: e.position,
            suggestion: e.suggestion,
            recovery: e.recovery,
          })),
          warnings: semanticResult.warnings,
        };
      }

      // Send result back to main thread
      self.postMessage(result);
    } catch (error) {
      const errorHandler = new IALErrorHandler();
      const enhanced = errorHandler.enhanceError(
        error instanceof Error ? error : new Error(String(error)),
        source
      );

      const result: CompileResult = {
        type: 'result',
        id,
        success: false,
        errors: [{
          message: error instanceof Error ? error.message : String(error),
        }],
        enhancedErrors: [{
          severity: enhanced.severity,
          message: enhanced.message,
          code: enhanced.code,
          position: enhanced.position,
          suggestion: enhanced.suggestion,
          recovery: enhanced.recovery,
        }],
        warnings: [],
      };

      self.postMessage(result);
    }
  }
};

