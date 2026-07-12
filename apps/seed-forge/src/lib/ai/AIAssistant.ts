// THE SEED v2.0 - AI Assistant (Rule-Based Fallback)
// Provides AI-like features using rule-based systems

import { IALAutocomplete } from '@taowind/ial-compiler/Autocomplete';
import { compileIAL } from '@taowind/ial-compiler';
import { TemplateManager, Template, TemplateType } from './TemplateManager';
import { RuleManager, NLPRule } from './RuleManager';

/**
 * AI Assistant Configuration
 */
interface AIAssistantConfig {
  enableLLM?: boolean;
  llmClient?: any; // Optional LLM client
  fallbackMode: 'rule-based' | 'template-based' | 'hybrid';
}

/**
 * AI Assistant
 * Provides AI-like features with rule-based fallback
 */
export class AIAssistant {
  private config: AIAssistantConfig;
  private autocomplete: IALAutocomplete;
  private templateSystem: ContentTemplateSystem;

  private templateManager: TemplateManager;
  private ruleManager: RuleManager;

  constructor(config: AIAssistantConfig = { fallbackMode: 'rule-based' }) {
    this.config = config;
    this.autocomplete = new IALAutocomplete();
    this.templateSystem = new ContentTemplateSystem();
    this.templateManager = new TemplateManager();
    this.ruleManager = new RuleManager();
  }

  /**
   * Get template manager
   */
  getTemplateManager(): TemplateManager {
    return this.templateManager;
  }

  /**
   * Get rule manager
   */
  getRuleManager(): RuleManager {
    return this.ruleManager;
  }

  /**
   * Convert natural language to IAL
   */
  async naturalLanguageToIAL(text: string): Promise<{
    success: boolean;
    ial: string;
    confidence: number;
    alternatives?: string[];
  }> {
    // Try LLM if available
    if (this.config.enableLLM && this.config.llmClient) {
      try {
        const result = await this.config.llmClient.convert(text);
        return {
          success: true,
          ial: result.ial,
          confidence: result.confidence || 0.8,
          alternatives: result.alternatives,
        };
      } catch (error) {
        // Fallback to rule-based
        console.warn('LLM conversion failed, using rule-based fallback:', error);
      }
    }

    // Rule-based fallback
    return this.ruleBasedNLPToIAL(text);
  }

  /**
   * Rule-based natural language to IAL conversion
   */
  private ruleBasedNLPToIAL(text: string): {
    success: boolean;
    ial: string;
    confidence: number;
    alternatives?: string[];
  } {
    // Use RuleManager for matching
    const match = this.ruleManager.match(text);
    
    if (match.matched && match.ial) {
      return {
        success: true,
        ial: match.ial,
        confidence: match.confidence || 0.7,
        alternatives: match.alternatives,
      };
    }

    // Default fallback
    return {
      success: false,
      ial: 'Ψ : K : V', // Default IAL
      confidence: 0.3,
      alternatives: ['Ψ : K : V', 'W₁ : Γ : I', 'Ω : Π : D'],
    };
  }


  /**
   * Generate content (story, description, etc.)
   */
  async generateContent(prompt: string, type: TemplateType = 'description', templateId?: string): Promise<string> {
    // Try LLM if available
    if (this.config.enableLLM && this.config.llmClient) {
      try {
        return await this.config.llmClient.generate(prompt, type);
      } catch (error) {
        console.warn('LLM generation failed, using template-based fallback:', error);
      }
    }

    // Use TemplateManager if template ID is provided
    if (templateId) {
      const template = this.templateManager.getTemplate(templateId);
      if (template) {
        const variables = this.templateManager.extractVariables(prompt, template);
        return this.templateManager.fillTemplate(template, variables);
      }
    }

    // Template-based fallback (use TemplateManager)
    const templates = this.templateManager.getTemplates(type);
    if (templates.length > 0) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const variables = this.templateManager.extractVariables(prompt, template);
      return this.templateManager.fillTemplate(template, variables);
    }

    // Fallback to old system
    return this.templateSystem.generate(prompt, type);
  }

  /**
   * Generate Agent dialogue
   */
  async generateDialogue(context: {
    agentName: string;
    agentPersonality: string;
    situation: string;
    previousDialogue?: string[];
  }): Promise<string> {
    // Try LLM if available
    if (this.config.enableLLM && this.config.llmClient) {
      try {
        return await this.config.llmClient.generateDialogue(context);
      } catch (error) {
        console.warn('LLM dialogue generation failed, using template-based fallback:', error);
      }
    }

    // Template-based fallback
    return this.templateSystem.generateDialogue(context);
  }

  /**
   * Smart code completion (enhanced)
   */
  async smartCompletion(
    source: string,
    cursorPosition: number,
    context?: {
      previousExpressions?: string[];
      currentLayer?: 'white' | 'blue' | 'gold';
    }
  ): Promise<{
    suggestions: string[];
    explanations?: string[];
  }> {
    // Get basic autocomplete
    const basicSuggestions = this.autocomplete.getSuggestions(source, cursorPosition);

    // Enhance with context
    const enhanced = this.enhanceWithContext(
      basicSuggestions.suggestions,
      context
    );

    // Add explanations
    const explanations = enhanced.map(suggestion => 
      this.explainSuggestion(suggestion, context)
    );

    return {
      suggestions: enhanced,
      explanations,
    };
  }

  /**
   * Enhance suggestions with context
   */
  private enhanceWithContext(
    suggestions: string[],
    context?: {
      previousExpressions?: string[];
      currentLayer?: 'white' | 'blue' | 'gold';
    }
  ): string[] {
    if (!context) return suggestions;

    // Filter by layer if specified
    if (context.currentLayer) {
      const layerGlyphs = this.autocomplete.getLayerSuggestions(context.currentLayer);
      return suggestions.filter(s => layerGlyphs.includes(s));
    }

    // Boost suggestions based on previous expressions
    if (context.previousExpressions && context.previousExpressions.length > 0) {
      const usedGlyphs = new Set<string>();
      context.previousExpressions.forEach(expr => {
        const tokens = expr.split(/\s+/);
        tokens.forEach(token => {
          if (token.match(/^[A-ZÆΩΨΛΣΦΘΗΞΓΠΧΖΚΤΒW₁₂₃₄₊∞Δ]+$/)) {
            usedGlyphs.add(token);
          }
        });
      });

      // Boost frequently used glyphs
      const boosted = suggestions.map(s => {
        if (usedGlyphs.has(s)) {
          return s; // Keep at front
        }
        return s;
      });

      return boosted;
    }

    return suggestions;
  }

  /**
   * Explain a suggestion
   */
  private explainSuggestion(
    suggestion: string,
    context?: {
      currentLayer?: 'white' | 'blue' | 'gold';
    }
  ): string {
    const explanations: Record<string, string> = {
      'Ψ': '意识（PSI）- White层：表示意识或心理场',
      'W₁': '白色种子（WHITE_SEED）- White层：表示意识的基础',
      'Ω': '终点（OMEGA）- White层：表示完成或终点',
      'Γ': '结构（GAMMA）- Blue层：表示结构或框架',
      'K': '核心（KAPPA）- Blue层：表示核心节点',
      'Z': '边界（ZETA）- Blue层：表示路径或边界',
      'I': '帝国（IMPERIUM）- Gold层：表示执行或控制',
      'V': '向量（VECTOR）- Gold层：表示方向或执行',
      'D': '领域（DOMINION）- Gold层：表示领域或范围',
    };

    return explanations[suggestion] || `符号：${suggestion}`;
  }

  /**
   * Validate and suggest fixes
   */
  async validateAndFix(ial: string): Promise<{
    isValid: boolean;
    fixed?: string;
    suggestions?: string[];
    errors?: string[];
  }> {
    // Try to compile
    const result = compileIAL(ial);
    
    if (result.success) {
      return {
        isValid: true,
      };
    }

    // Try to fix errors
    const fixed = this.attemptFix(ial, result.errors);
    
    return {
      isValid: false,
      fixed,
      suggestions: this.generateFixSuggestions(ial, result.errors),
      errors: result.errors.map(e => e.message),
    };
  }

  /**
   * Attempt to fix IAL expression
   */
  private attemptFix(ial: string, errors: any[]): string | undefined {
    // Simple fixes
    let fixed = ial;

    // Fix common issues
    errors.forEach(error => {
      if (error.message.includes('missing')) {
        // Try to add missing elements
        if (error.message.includes('White')) {
          fixed = `Ψ : ${fixed}`;
        } else if (error.message.includes('Blue')) {
          fixed = fixed.replace(':', ': K :');
        } else if (error.message.includes('Gold')) {
          fixed = `${fixed} : V`;
        }
      }
    });

    // Validate fix
    const fixedResult = compileIAL(fixed);
    if (fixedResult.success) {
      return fixed;
    }

    return undefined;
  }

  /**
   * Generate fix suggestions
   */
  private generateFixSuggestions(ial: string, errors: any[]): string[] {
    const suggestions: string[] = [];

    errors.forEach(error => {
      if (error.message.includes('syntax')) {
        suggestions.push('检查语法：确保使用正确的操作符（:、→）');
      }
      if (error.message.includes('layer')) {
        suggestions.push('检查层结构：确保包含 White、Blue、Gold 三层');
      }
      if (error.message.includes('unknown')) {
        suggestions.push('检查字符：确保使用有效的 IAL 字符');
      }
    });

    return suggestions;
  }
}

/**
 * Content Template System
 * Generates content using templates
 */
class ContentTemplateSystem {
  private templates: Map<string, string[]> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize templates
   */
  private initializeTemplates(): void {
    // Story templates
    this.templates.set('story', [
      '在遥远的宇宙中，{entity} 通过 {action} 创造了 {result}。',
      '{entity} 的意识在 {context} 中觉醒，开始了 {journey} 的旅程。',
      '当 {event} 发生时，{entity} 必须 {action} 以 {goal}。',
    ]);

    // Description templates
    this.templates.set('description', [
      '{entity} 是一个 {adjective} 的存在，具有 {features}。',
      '在 {location}，{entity} 展现出了 {characteristics}。',
      '{entity} 的结构由 {components} 组成，呈现出 {appearance}。',
    ]);

    // Dialogue templates
    this.templates.set('dialogue', [
      '{agent}: "{greeting}，{statement}"',
      '{agent}: "我理解 {concept}，但 {objection}"',
      '{agent}: "{agreement}，让我们 {action}"',
    ]);

    // World templates
    this.templates.set('world', [
      '这个世界由 {elements} 构成，充满了 {atmosphere}。',
      '在 {worldName}，{rules} 支配着一切。',
      '{worldName} 是一个 {type} 的世界，其中 {features}。',
    ]);
  }

  /**
   * Generate content
   */
  generate(prompt: string, type: 'story' | 'description' | 'dialogue' | 'world'): string {
    const templates = this.templates.get(type) || [];
    if (templates.length === 0) {
      return `基于提示 "${prompt}" 生成的内容。`;
    }

    // Select template
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Extract entities from prompt
    const entities = this.extractEntities(prompt);

    // Fill template
    let content = template;
    Object.entries(entities).forEach(([key, value]) => {
      content = content.replace(`{${key}}`, value || '未知');
    });

    return content;
  }

  /**
   * Generate dialogue
   */
  generateDialogue(context: {
    agentName: string;
    agentPersonality: string;
    situation: string;
    previousDialogue?: string[];
  }): string {
    const templates = this.templates.get('dialogue') || [];
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Generate based on personality
    const responses = this.getPersonalityResponses(context.agentPersonality);
    const response = responses[Math.floor(Math.random() * responses.length)];

    return `${context.agentName}: "${response}"`;
  }

  /**
   * Extract entities from prompt
   */
  private extractEntities(prompt: string): Record<string, string> {
    // Simple entity extraction
    const entities: Record<string, string> = {};

    // Extract common entities
    const entityMatch = prompt.match(/(?:create|make|generate|build)\s+(\w+)/i);
    if (entityMatch) {
      entities.entity = entityMatch[1];
    }

    // Extract adjectives
    const adjMatch = prompt.match(/(?:a|an)\s+(\w+)\s+(\w+)/i);
    if (adjMatch) {
      entities.adjective = adjMatch[1];
    }

    return entities;
  }

  /**
   * Get personality-based responses
   */
  private getPersonalityResponses(personality: string): string[] {
    const lower = personality.toLowerCase();
    
    if (lower.includes('friendly') || lower.includes('友好')) {
      return [
        '你好！很高兴见到你。',
        '我理解你的想法。',
        '让我们一起来解决这个问题。',
      ];
    }
    
    if (lower.includes('serious') || lower.includes('严肃')) {
      return [
        '我明白了。',
        '这需要仔细考虑。',
        '让我们分析一下情况。',
      ];
    }

    // Default
    return [
      '我理解了。',
      '这很有趣。',
      '让我们继续。',
    ];
  }
}

