// THE SEED v2.0 - AGI Backend - IAL Service
// Service layer for IAL compilation and execution

import { compileIAL, validateIAL, CompiledIAL, CompilationResult } from '../../ial';
import { IALWorkerCompiler } from '../../ial/WorkerCompiler';
import { IALAutocomplete } from '../../ial/Autocomplete';

/**
 * IAL Service
 * Provides IAL compilation and execution services
 */
export class IALService {
  private workerCompiler: IALWorkerCompiler;
  private autocomplete: IALAutocomplete;

  constructor() {
    this.workerCompiler = new IALWorkerCompiler();
    this.autocomplete = new IALAutocomplete();
  }

  /**
   * Compile IAL expression
   */
  async compile(source: string, useWorker: boolean = false): Promise<CompilationResult> {
    if (useWorker) {
      return await this.workerCompiler.compile(source);
    } else {
      return compileIAL(source);
    }
  }

  /**
   * Validate IAL expression
   */
  validate(source: string): {
    valid: boolean;
    errors: string[];
  } {
    return validateIAL(source);
  }

  /**
   * Execute compiled IAL
   */
  async execute(compiled: CompiledIAL[]): Promise<any> {
    // Execute compiled IAL expressions
    // This would integrate with OSE or SEED-RT
    return {
      executed: compiled.length,
      results: compiled.map(c => ({
        domain: c.domain,
        operation: c.operation,
        success: true,
      })),
    };
  }

  /**
   * Get autocomplete suggestions
   */
  getAutocomplete(
    source: string,
    cursorPosition: number,
    context?: {
      previousExpressions?: string[];
      currentLayer?: 'white' | 'blue' | 'gold';
    }
  ): {
    suggestions: string[];
    startPosition: number;
    endPosition: number;
    explanations?: string[];
  } {
    const basic = this.autocomplete.getSuggestions(source, cursorPosition);
    
    // Enhance with context if provided
    if (context) {
      const enhanced = this.autocomplete.getContextualSuggestions(source, cursorPosition);
      return {
        ...basic,
        suggestions: enhanced.slice(0, 10),
      };
    }

    return basic;
  }

  /**
   * Compile using Web Worker
   */
  async workerCompile(source: string): Promise<CompilationResult> {
    return await this.workerCompiler.compile(source);
  }

  /**
   * Batch compile
   */
  async batchCompile(sources: string[]): Promise<CompilationResult[]> {
    return await this.workerCompiler.compileBatch(sources);
  }
}

