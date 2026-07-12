// THE SEED v2.0 - Template Manager
// Manages custom templates for content generation

/**
 * Template Type
 */
export type TemplateType = 'story' | 'description' | 'dialogue' | 'world';

/**
 * Template
 */
export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  content: string;
  variables: string[];
  description?: string;
  author?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Template Manager
 * Manages custom templates for content generation
 */
export class TemplateManager {
  private templates: Map<string, Template> = new Map();
  private defaultTemplates: Map<TemplateType, Template[]> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.loadCustomTemplates();
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    // Story templates
    this.defaultTemplates.set('story', [
      {
        id: 'story-1',
        name: '宇宙创造',
        type: 'story',
        content: '在遥远的宇宙中，{entity} 通过 {action} 创造了 {result}。',
        variables: ['entity', 'action', 'result'],
        description: '描述宇宙创造的故事',
        tags: ['creation', 'universe'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'story-2',
        name: '意识觉醒',
        type: 'story',
        content: '{entity} 的意识在 {context} 中觉醒，开始了 {journey} 的旅程。',
        variables: ['entity', 'context', 'journey'],
        description: '描述意识觉醒的故事',
        tags: ['consciousness', 'awakening'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'story-3',
        name: '事件触发',
        type: 'story',
        content: '当 {event} 发生时，{entity} 必须 {action} 以 {goal}。',
        variables: ['event', 'entity', 'action', 'goal'],
        description: '描述事件驱动的故事',
        tags: ['event', 'action'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    // Description templates
    this.defaultTemplates.set('description', [
      {
        id: 'desc-1',
        name: '实体描述',
        type: 'description',
        content: '{entity} 是一个 {adjective} 的存在，具有 {features}。',
        variables: ['entity', 'adjective', 'features'],
        description: '描述实体的基本特征',
        tags: ['entity', 'basic'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'desc-2',
        name: '位置描述',
        type: 'description',
        content: '在 {location}，{entity} 展现出了 {characteristics}。',
        variables: ['location', 'entity', 'characteristics'],
        description: '描述实体在特定位置的表现',
        tags: ['location', 'context'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'desc-3',
        name: '结构描述',
        type: 'description',
        content: '{entity} 的结构由 {components} 组成，呈现出 {appearance}。',
        variables: ['entity', 'components', 'appearance'],
        description: '描述实体的结构',
        tags: ['structure', 'components'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    // Dialogue templates
    this.defaultTemplates.set('dialogue', [
      {
        id: 'dialogue-1',
        name: '问候对话',
        type: 'dialogue',
        content: '{agent}: "{greeting}，{statement}"',
        variables: ['agent', 'greeting', 'statement'],
        description: '友好的问候对话',
        tags: ['greeting', 'friendly'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'dialogue-2',
        name: '讨论对话',
        type: 'dialogue',
        content: '{agent}: "我理解 {concept}，但 {objection}"',
        variables: ['agent', 'concept', 'objection'],
        description: '讨论和异议的对话',
        tags: ['discussion', 'objection'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'dialogue-3',
        name: '行动对话',
        type: 'dialogue',
        content: '{agent}: "{agreement}，让我们 {action}"',
        variables: ['agent', 'agreement', 'action'],
        description: '同意并行动的对话',
        tags: ['agreement', 'action'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    // World templates
    this.defaultTemplates.set('world', [
      {
        id: 'world-1',
        name: '世界构成',
        type: 'world',
        content: '这个世界由 {elements} 构成，充满了 {atmosphere}。',
        variables: ['elements', 'atmosphere'],
        description: '描述世界的基本构成',
        tags: ['composition', 'atmosphere'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'world-2',
        name: '世界规则',
        type: 'world',
        content: '在 {worldName}，{rules} 支配着一切。',
        variables: ['worldName', 'rules'],
        description: '描述世界的规则',
        tags: ['rules', 'governance'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'world-3',
        name: '世界特征',
        type: 'world',
        content: '{worldName} 是一个 {type} 的世界，其中 {features}。',
        variables: ['worldName', 'type', 'features'],
        description: '描述世界的特征',
        tags: ['features', 'type'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
  }

  /**
   * Get templates by type
   */
  getTemplates(type: TemplateType): Template[] {
    const defaultTemplates = this.defaultTemplates.get(type) || [];
    const customTemplates = Array.from(this.templates.values())
      .filter(t => t.type === type);
    
    return [...defaultTemplates, ...customTemplates];
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): Template | null {
    // Check custom templates first
    if (this.templates.has(id)) {
      return this.templates.get(id)!;
    }

    // Check default templates
    for (const templates of this.defaultTemplates.values()) {
      const template = templates.find(t => t.id === id);
      if (template) {
        return template;
      }
    }

    return null;
  }

  /**
   * Add custom template
   */
  addTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: Template = {
      ...template,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.templates.set(id, newTemplate);
    this.saveCustomTemplates();
    
    return newTemplate;
  }

  /**
   * Update template
   */
  updateTemplate(id: string, updates: Partial<Template>): boolean {
    const template = this.getTemplate(id);
    if (!template) {
      return false;
    }

    // Can't update default templates
    if (!template.id.startsWith('custom-')) {
      return false;
    }

    const updated: Template = {
      ...template,
      ...updates,
      id, // Preserve ID
      updatedAt: Date.now(),
    };

    this.templates.set(id, updated);
    this.saveCustomTemplates();
    
    return true;
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    const template = this.getTemplate(id);
    if (!template) {
      return false;
    }

    // Can't delete default templates
    if (!template.id.startsWith('custom-')) {
      return false;
    }

    this.templates.delete(id);
    this.saveCustomTemplates();
    
    return true;
  }

  /**
   * Fill template with variables
   */
  fillTemplate(template: Template, variables: Record<string, string>): string {
    let content = template.content;
    
    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      content = content.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
    });

    return content;
  }

  /**
   * Extract variables from prompt
   */
  extractVariables(prompt: string, template: Template): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Simple extraction based on template variables
    template.variables.forEach(variable => {
      // Try to extract from prompt
      const patterns: Record<string, RegExp> = {
        entity: /(?:create|make|generate|build)\s+(\w+)/i,
        action: /(?:通过|使用|执行)\s+(\w+)/i,
        result: /(?:创造|生成|构建)\s+(\w+)/i,
        location: /(?:在|位于)\s+(\w+)/i,
        adjective: /(?:一个|的)\s+(\w+)\s+(?:存在|实体)/i,
      };

      if (patterns[variable]) {
        const match = prompt.match(patterns[variable]);
        if (match) {
          variables[variable] = match[1];
        }
      }
    });

    return variables;
  }

  /**
   * Export templates
   */
  exportTemplates(): string {
    const customTemplates = Array.from(this.templates.values());
    return JSON.stringify({
      templates: customTemplates,
      version: '1.0',
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Import templates
   */
  importTemplates(data: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.templates || !Array.isArray(parsed.templates)) {
        return { success: false, imported: 0, errors: ['Invalid template format'] };
      }

      let imported = 0;
      const errors: string[] = [];

      parsed.templates.forEach((template: any) => {
        try {
          // Validate template
          if (!template.name || !template.type || !template.content) {
            errors.push(`Invalid template: ${template.name || 'unknown'}`);
            return;
          }

          // Add template (will generate new ID)
          this.addTemplate({
            name: template.name,
            type: template.type,
            content: template.content,
            variables: template.variables || [],
            description: template.description,
            author: template.author,
            tags: template.tags,
          });
          imported++;
        } catch (error) {
          errors.push(`Failed to import template: ${template.name || 'unknown'}`);
        }
      });

      return { success: true, imported, errors };
    } catch (error) {
      return { success: false, imported: 0, errors: [error instanceof Error ? error.message : String(error)] };
    }
  }

  /**
   * Save custom templates to localStorage
   */
  private saveCustomTemplates(): void {
    try {
      const customTemplates = Array.from(this.templates.values());
      localStorage.setItem('ial-custom-templates', JSON.stringify(customTemplates));
    } catch (error) {
      console.warn('Failed to save custom templates:', error);
    }
  }

  /**
   * Load custom templates from localStorage
   */
  private loadCustomTemplates(): void {
    try {
      const stored = localStorage.getItem('ial-custom-templates');
      if (stored) {
        const customTemplates = JSON.parse(stored) as Template[];
        customTemplates.forEach(template => {
          this.templates.set(template.id, template);
        });
      }
    } catch (error) {
      console.warn('Failed to load custom templates:', error);
    }
  }
}

