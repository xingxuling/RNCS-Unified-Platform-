// THE SEED v2.0 - AGI Backend - AI Assistant Service
// Service layer for AI assistant features

import { AIAssistant } from '../../ai/AIAssistant';

/**
 * AI Assistant Service
 * Provides AI assistant features
 */
export class AIAssistantService {
  private aiAssistant: AIAssistant;

  constructor() {
    this.aiAssistant = new AIAssistant({ fallbackMode: 'rule-based' });
  }

  /**
   * Convert natural language to IAL
   */
  async nlpToIAL(text: string): Promise<{
    success: boolean;
    ial: string;
    confidence: number;
    alternatives?: string[];
  }> {
    return await this.aiAssistant.naturalLanguageToIAL(text);
  }

  /**
   * Generate content
   */
  async generateContent(
    prompt: string,
    type: 'story' | 'description' | 'dialogue' | 'world' = 'description'
  ): Promise<string> {
    return await this.aiAssistant.generateContent(prompt, type);
  }

  /**
   * Generate dialogue
   */
  async generateDialogue(context: {
    agentName: string;
    agentPersonality: string;
    situation: string;
    previousDialogue?: string[];
  }): Promise<string> {
    return await this.aiAssistant.generateDialogue(context);
  }

  /**
   * Get smart code completion
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
    return await this.aiAssistant.smartCompletion(source, cursorPosition, context);
  }

  /**
   * Validate and fix IAL
   */
  async validateAndFix(ial: string): Promise<{
    isValid: boolean;
    fixed?: string;
    suggestions?: string[];
    errors?: string[];
  }> {
    return await this.aiAssistant.validateAndFix(ial);
  }

  /**
   * Get template manager
   */
  getTemplateManager() {
    return this.aiAssistant.getTemplateManager();
  }

  /**
   * Get rule manager
   */
  getRuleManager() {
    return this.aiAssistant.getRuleManager();
  }
}

