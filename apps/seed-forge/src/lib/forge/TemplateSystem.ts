// THE SEED v2.0 - Template System
// Universe Template Management

import { UniverseTemplate, WorldTemplate, RuleTemplate, FateNodeTemplate } from './types';

/**
 * Template Registry
 */
export class TemplateSystem {
  private templates: Map<string, UniverseTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Register a template
   */
  register(template: UniverseTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  get(templateId: string): UniverseTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates
   */
  getAll(): UniverseTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Search templates
   */
  search(query: string): UniverseTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // Default Universe Template
    this.register({
      id: 'default_universe',
      name: 'Default Universe',
      description: 'A basic universe with a single world',
      ialExpression: 'W₁ : Γ : I',
      worlds: [
        {
          name: 'Root World',
          ialExpression: 'Ψ : Γ K : V',
          structure: {
            dimensions: [100, 100],
            type: 'grid',
          },
        },
      ],
      rules: [],
      fateNodes: [
        {
          name: 'Origin',
          type: 'origin',
          convergence: 0.5,
        },
      ],
      tags: ['default', 'basic'],
      metadata: {},
    });

    // Fantasy Universe Template
    this.register({
      id: 'fantasy_universe',
      name: 'Fantasy Universe',
      description: 'A fantasy-themed universe with multiple worlds',
      ialExpression: 'W₁ : Γ Π Χ : I D',
      worlds: [
        {
          name: 'Main World',
          ialExpression: 'Ψ : Γ K Z : V',
          structure: {
            dimensions: [200, 200],
            type: 'grid',
          },
        },
        {
          name: 'Magic Realm',
          ialExpression: 'Λ : Σ Φ : A₊',
          structure: {
            dimensions: [150, 150],
            type: 'grid',
          },
        },
      ],
      rules: [
        {
          name: 'Magic Rule',
          ialExpression: 'Θ : Π : PΘ',
          priority: 1,
        },
      ],
      fateNodes: [
        {
          name: 'Hero Journey',
          type: 'mainline',
          convergence: 0.7,
        },
      ],
      tags: ['fantasy', 'magic', 'adventure'],
      metadata: {
        theme: 'fantasy',
      },
    });

    // Sci-Fi Universe Template
    this.register({
      id: 'scifi_universe',
      name: 'Sci-Fi Universe',
      description: 'A science fiction universe with advanced technology',
      ialExpression: 'W₁ : Γ Π Χ Z : I D V',
      worlds: [
        {
          name: 'Home Planet',
          ialExpression: 'Ψ : Γ K : V',
          structure: {
            dimensions: [300, 300],
            type: 'grid',
          },
        },
        {
          name: 'Space Station',
          ialExpression: 'Æ : Σ : Z₊',
          structure: {
            dimensions: [100, 100],
            type: 'grid',
          },
        },
      ],
      rules: [
        {
          name: 'Physics Rule',
          ialExpression: 'Π : T : V',
          priority: 1,
        },
      ],
      fateNodes: [
        {
          name: 'Exploration',
          type: 'exploration',
          convergence: 0.6,
        },
      ],
      tags: ['scifi', 'space', 'technology'],
      metadata: {
        theme: 'scifi',
      },
    });

    // Minimal Universe Template
    this.register({
      id: 'minimal_universe',
      name: 'Minimal Universe',
      description: 'A minimal universe for testing',
      ialExpression: 'Æ : Γ : I',
      worlds: [
        {
          name: 'Test World',
          ialExpression: 'Ψ : K : V',
          structure: {
            dimensions: [50, 50],
            type: 'grid',
          },
        },
      ],
      rules: [],
      fateNodes: [],
      tags: ['minimal', 'test'],
      metadata: {},
    });
  }

  /**
   * Create template from existing universe
   */
  createFromUniverse(
    universeId: string,
    name: string,
    description: string
  ): UniverseTemplate {
    // This would extract template from existing universe
    // For now, return a basic template
    return {
      id: `template_${Date.now()}`,
      name,
      description,
      ialExpression: 'W₁ : Γ : I',
      worlds: [],
      rules: [],
      fateNodes: [],
      tags: ['custom'],
      metadata: {
        sourceUniverse: universeId,
      },
    };
  }

  /**
   * Export template to JSON
   */
  exportTemplate(templateId: string): string {
    const template = this.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  importTemplate(json: string): UniverseTemplate {
    try {
      const template = JSON.parse(json) as UniverseTemplate;
      this.validateTemplate(template);
      this.register(template);
      return template;
    } catch (error) {
      throw new Error(`Invalid template JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate template
   */
  private validateTemplate(template: UniverseTemplate): void {
    if (!template.id) {
      throw new Error('Template must have an id');
    }
    if (!template.name) {
      throw new Error('Template must have a name');
    }
    if (!template.ialExpression) {
      throw new Error('Template must have an ialExpression');
    }
  }
}

