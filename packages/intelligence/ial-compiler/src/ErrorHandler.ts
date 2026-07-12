// THE SEED v2.0 - IAL Error Handler
// Enhanced error handling and recovery

import { Token } from './Lexer';
import { ASTNode } from './Parser';
import { SemanticError } from './SemanticAnalyzer';

/**
 * Error Severity
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Enhanced Error
 */
export interface EnhancedError {
  severity: ErrorSeverity;
  message: string;
  code: string;
  position?: {
    line: number;
    column: number;
    length?: number;
  };
  suggestion?: string;
  context?: string;
  recovery?: string;
}

/**
 * IAL Error Handler
 */
export class IALErrorHandler {
  /**
   * Enhance error message
   */
  enhanceError(error: Error, source?: string, position?: { line: number; column: number }): EnhancedError {
    const message = error.message;
    
    // Parse error message for common patterns
    if (message.includes('Expected')) {
      return this.handleExpectedError(error, source, position);
    }
    
    if (message.includes('Unterminated')) {
      return this.handleUnterminatedError(error, source, position);
    }
    
    if (message.includes('Invalid')) {
      return this.handleInvalidError(error, source, position);
    }
    
    // Default enhancement
    return {
      severity: ErrorSeverity.ERROR,
      message: error.message,
      code: 'UNKNOWN_ERROR',
      position,
      suggestion: '请检查 IAL 表达式语法',
    };
  }

  /**
   * Handle "Expected" errors
   */
  private handleExpectedError(
    error: Error,
    source?: string,
    position?: { line: number; column: number }
  ): EnhancedError {
    const match = error.message.match(/Expected "([^"]+)" (.*)/);
    if (match) {
      const expected = match[1];
      const context = match[2];
      
      let suggestion = '';
      let recovery = '';
      
      if (expected === ':') {
        suggestion = 'IAL 表达式需要使用 ":" 分隔 White、Blue、Gold 层';
        recovery = '在层之间添加 ":" 分隔符，例如: Ψ : Γ : V';
      } else if (expected === '{') {
        suggestion = '缺少左大括号 "{"';
        recovery = '在 CIV 或 MATRIX 关键字后添加 "{"';
      } else if (expected === '}') {
        suggestion = '缺少右大括号 "}"';
        recovery = '在块结束处添加 "}"';
      } else if (expected.includes('glyph')) {
        suggestion = `需要 ${expected} 字符`;
        recovery = '检查字符是否正确，参考 IAL 字符表';
      }
      
      return {
        severity: ErrorSeverity.ERROR,
        message: error.message,
        code: 'EXPECTED_TOKEN',
        position,
        suggestion,
        recovery,
        context,
      };
    }
    
    return this.defaultError(error, position);
  }

  /**
   * Handle "Unterminated" errors
   */
  private handleUnterminatedError(
    error: Error,
    source?: string,
    position?: { line: number; column: number }
  ): EnhancedError {
    return {
      severity: ErrorSeverity.ERROR,
      message: error.message,
      code: 'UNTERMINATED_STRING',
      position,
      suggestion: '字符串缺少结束引号',
      recovery: '在字符串末尾添加匹配的引号（" 或 \'）',
    };
  }

  /**
   * Handle "Invalid" errors
   */
  private handleInvalidError(
    error: Error,
    source?: string,
    position?: { line: number; column: number }
  ): EnhancedError {
    const match = error.message.match(/Invalid (\w+) glyph: (.+)/);
    if (match) {
      const layer = match[1].toLowerCase();
      const glyph = match[2];
      
      let suggestion = '';
      let recovery = '';
      
      if (layer === 'white') {
        suggestion = `"${glyph}" 不是有效的 White 层字符`;
        recovery = '使用有效的 White 层字符，如: W₁, Æ, Ω, Ψ, Λ, Σ, Φ, Θ, Η, Ξ, ΔΩ, Ō';
      } else if (layer === 'blue') {
        suggestion = `"${glyph}" 不是有效的 Blue 层字符`;
        recovery = '使用有效的 Blue 层字符，如: Γ, Π, Χ, Z, K, T, B₂, F₁, S₄, R₀, NΣ, C∞';
      } else if (layer === 'gold') {
        suggestion = `"${glyph}" 不是有效的 Gold 层字符`;
        recovery = '使用有效的 Gold 层字符，如: I, D, V, A₊, Y, Z₊, G₁, MΩ, PΘ, L₁, EΔ, K∞';
      }
      
      return {
        severity: ErrorSeverity.ERROR,
        message: error.message,
        code: 'INVALID_GLYPH',
        position,
        suggestion,
        recovery,
        context: `Layer: ${layer}, Glyph: ${glyph}`,
      };
    }
    
    return this.defaultError(error, position);
  }

  /**
   * Default error
   */
  private defaultError(error: Error, position?: { line: number; column: number }): EnhancedError {
    return {
      severity: ErrorSeverity.ERROR,
      message: error.message,
      code: 'UNKNOWN_ERROR',
      position,
      suggestion: '请检查 IAL 表达式语法',
    };
  }

  /**
   * Format error for display
   */
  formatError(error: EnhancedError): string {
    let formatted = `[${error.severity.toUpperCase()}] ${error.message}`;
    
    if (error.position) {
      formatted += `\n位置: 第 ${error.position.line} 行, 第 ${error.position.column} 列`;
    }
    
    if (error.suggestion) {
      formatted += `\n建议: ${error.suggestion}`;
    }
    
    if (error.recovery) {
      formatted += `\n修复: ${error.recovery}`;
    }
    
    return formatted;
  }

  /**
   * Get error color
   */
  getErrorColor(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.INFO:
        return 'text-blue-500';
      case ErrorSeverity.WARNING:
        return 'text-yellow-500';
      case ErrorSeverity.ERROR:
        return 'text-red-500';
      case ErrorSeverity.FATAL:
        return 'text-red-700';
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Get error icon
   */
  getErrorIcon(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.INFO:
        return 'ℹ️';
      case ErrorSeverity.WARNING:
        return '⚠️';
      case ErrorSeverity.ERROR:
        return '❌';
      case ErrorSeverity.FATAL:
        return '💥';
      default:
        return '❓';
    }
  }
}

