// THE SEED v2.0 - Rule Manager
// Manages custom NLP-to-IAL rules

/**
 * NLP Rule
 */
export interface NLPRule {
  id: string;
  name: string;
  pattern: string; // Regex pattern
  ial: string; // IAL expression template
  confidence: number; // 0-1
  alternatives?: string[]; // Alternative IAL expressions
  description?: string;
  tags?: string[];
  priority: number; // Higher priority rules are checked first
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Rule Manager
 * Manages custom NLP-to-IAL conversion rules
 */
export class RuleManager {
  private rules: Map<string, NLPRule> = new Map();
  private defaultRules: NLPRule[] = [];

  constructor() {
    this.initializeDefaultRules();
    this.loadCustomRules();
  }

  /**
   * Initialize default rules
   */
  private initializeDefaultRules(): void {
    this.defaultRules = [
      {
        id: 'rule-1',
        name: '创建意识',
        pattern: '(?:create|make|generate|build)\\s+(?:a\\s+)?(?:consciousness|awareness|mind)',
        ial: 'Ψ : K : V',
        confidence: 0.8,
        alternatives: ['W₁ : K : V', 'Æ : K : V'],
        description: '匹配创建意识的描述',
        tags: ['consciousness', 'creation'],
        priority: 10,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rule-2',
        name: '创建结构',
        pattern: '(?:create|make|generate|build)\\s+(?:a\\s+)?(?:structure|system|framework)',
        ial: 'W₁ : Γ : I',
        confidence: 0.8,
        alternatives: ['Ψ : Γ : I', 'Ω : Γ : I'],
        description: '匹配创建结构的描述',
        tags: ['structure', 'creation'],
        priority: 10,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rule-3',
        name: '创建宇宙',
        pattern: '(?:create|make|generate|build)\\s+(?:a\\s+)?(?:universe|world|realm)',
        ial: 'CIV : Γ K Z : I',
        confidence: 0.9,
        alternatives: ['CIV : Γ Π : I', 'CIV : K Z : I'],
        description: '匹配创建宇宙的描述',
        tags: ['universe', 'creation'],
        priority: 10,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rule-4',
        name: '创建Agent',
        pattern: '(?:create|make|generate|build)\\s+(?:a\\s+)?(?:agent|entity|character)',
        ial: 'Ψ : K : V',
        confidence: 0.8,
        alternatives: ['W₁ : K : V', 'Æ : K : V'],
        description: '匹配创建Agent的描述',
        tags: ['agent', 'creation'],
        priority: 10,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rule-5',
        name: '执行操作',
        pattern: '(?:execute|run|perform|do)\\s+(?:action|operation|task)',
        ial: 'Ψ : K : V',
        confidence: 0.7,
        alternatives: ['Ω : K : V', 'Æ : K : V'],
        description: '匹配执行操作的描述',
        tags: ['execution', 'action'],
        priority: 9,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rule-6',
        name: '构建结构',
        pattern: '(?:build|construct|create)\\s+(?:structure|system)\\s+(?:with|using)\\s+(?:pattern|template)',
        ial: 'W₁ : Γ Π : I',
        confidence: 0.85,
        alternatives: ['Ψ : Γ Π : I', 'Ω : Γ Π : I'],
        description: '匹配使用模式构建结构的描述',
        tags: ['structure', 'pattern'],
        priority: 9,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rule-7',
        name: '增强',
        pattern: '(?:enhance|boost|strengthen|amplify)',
        ial: 'Ψ : K+ : V',
        confidence: 0.7,
        alternatives: ['W₁ : K+ : V', 'Æ : K+ : V'],
        description: '匹配增强的描述',
        tags: ['enhancement', 'modifier'],
        priority: 8,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rule-8',
        name: '减弱',
        pattern: '(?:reduce|weaken|decrease|diminish)',
        ial: 'Ψ : K- : V',
        confidence: 0.7,
        alternatives: ['W₁ : K- : V', 'Æ : K- : V'],
        description: '匹配减弱的描述',
        tags: ['reduction', 'modifier'],
        priority: 8,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rule-9',
        name: '无限',
        pattern: '(?:infinite|endless|unlimited)',
        ial: 'Ψ : K∞ : V',
        confidence: 0.8,
        alternatives: ['W₁ : K∞ : V', 'Ω : K∞ : V'],
        description: '匹配无限的描述',
        tags: ['infinity', 'modifier'],
        priority: 8,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'rule-10',
        name: '变化',
        pattern: '(?:change|transform|modify|alter)',
        ial: 'Ψ : KΔ : V',
        confidence: 0.7,
        alternatives: ['W₁ : KΔ : V', 'Æ : KΔ : V'],
        description: '匹配变化的描述',
        tags: ['change', 'modifier'],
        priority: 8,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  }

  /**
   * Get all rules (sorted by priority)
   */
  getAllRules(): NLPRule[] {
    const allRules = [...this.defaultRules, ...Array.from(this.rules.values())];
    return allRules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get rule by ID
   */
  getRule(id: string): NLPRule | null {
    // Check custom rules first
    if (this.rules.has(id)) {
      return this.rules.get(id)!;
    }

    // Check default rules
    const defaultRule = this.defaultRules.find(r => r.id === id);
    if (defaultRule) {
      return defaultRule;
    }

    return null;
  }

  /**
   * Add custom rule
   */
  addRule(rule: Omit<NLPRule, 'id' | 'createdAt' | 'updatedAt'>): NLPRule {
    // Validate regex pattern
    try {
      new RegExp(rule.pattern);
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${rule.pattern}`);
    }

    const id = `custom-rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRule: NLPRule = {
      ...rule,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.rules.set(id, newRule);
    this.saveCustomRules();
    
    return newRule;
  }

  /**
   * Update rule
   */
  updateRule(id: string, updates: Partial<NLPRule>): boolean {
    const rule = this.getRule(id);
    if (!rule) {
      return false;
    }

    // Can't update default rules
    if (!rule.id.startsWith('custom-rule-')) {
      return false;
    }

    // Validate regex if pattern is updated
    if (updates.pattern) {
      try {
        new RegExp(updates.pattern);
      } catch (error) {
        throw new Error(`Invalid regex pattern: ${updates.pattern}`);
      }
    }

    const updated: NLPRule = {
      ...rule,
      ...updates,
      id, // Preserve ID
      updatedAt: Date.now(),
    };

    this.rules.set(id, updated);
    this.saveCustomRules();
    
    return true;
  }

  /**
   * Delete rule
   */
  deleteRule(id: string): boolean {
    const rule = this.getRule(id);
    if (!rule) {
      return false;
    }

    // Can't delete default rules
    if (!rule.id.startsWith('custom-rule-')) {
      return false;
    }

    this.rules.delete(id);
    this.saveCustomRules();
    
    return true;
  }

  /**
   * Toggle rule enabled state
   */
  toggleRule(id: string): boolean {
    const rule = this.getRule(id);
    if (!rule) {
      return false;
    }

    // Can toggle default rules
    if (rule.id.startsWith('custom-rule-')) {
      return this.updateRule(id, { enabled: !rule.enabled });
    } else {
      // For default rules, we can't modify them, but we can create a disabled copy
      const disabledRule = {
        ...rule,
        id: `custom-rule-disabled-${Date.now()}`,
        enabled: false,
      };
      this.rules.set(disabledRule.id, disabledRule);
      this.saveCustomRules();
      return true;
    }
  }

  /**
   * Match text against rules
   */
  match(text: string): {
    matched: boolean;
    rule?: NLPRule;
    ial?: string;
    confidence?: number;
    alternatives?: string[];
  } {
    const rules = this.getAllRules();
    const lowerText = text.toLowerCase();

    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        const match = regex.exec(lowerText);
        
        if (match) {
          let ial = rule.ial;
          
          // Replace placeholders if any
          if (match.groups) {
            Object.entries(match.groups).forEach(([key, value]) => {
              ial = ial.replace(`{${key}}`, value || '');
            });
          }
          
          return {
            matched: true,
            rule,
            ial,
            confidence: rule.confidence,
            alternatives: rule.alternatives,
          };
        }
      } catch (error) {
        console.warn(`Error matching rule ${rule.id}:`, error);
      }
    }

    return { matched: false };
  }

  /**
   * Export rules
   */
  exportRules(): string {
    const customRules = Array.from(this.rules.values());
    return JSON.stringify({
      rules: customRules,
      version: '1.0',
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Import rules
   */
  importRules(data: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.rules || !Array.isArray(parsed.rules)) {
        return { success: false, imported: 0, errors: ['Invalid rule format'] };
      }

      let imported = 0;
      const errors: string[] = [];

      parsed.rules.forEach((rule: any) => {
        try {
          // Validate rule
          if (!rule.name || !rule.pattern || !rule.ial) {
            errors.push(`Invalid rule: ${rule.name || 'unknown'}`);
            return;
          }

          // Validate regex
          try {
            new RegExp(rule.pattern);
          } catch (error) {
            errors.push(`Invalid regex in rule: ${rule.name || 'unknown'}`);
            return;
          }

          // Add rule (will generate new ID)
          this.addRule({
            name: rule.name,
            pattern: rule.pattern,
            ial: rule.ial,
            confidence: rule.confidence || 0.7,
            alternatives: rule.alternatives,
            description: rule.description,
            tags: rule.tags,
            priority: rule.priority || 5,
            enabled: rule.enabled !== undefined ? rule.enabled : true,
          });
          imported++;
        } catch (error) {
          errors.push(`Failed to import rule: ${rule.name || 'unknown'}`);
        }
      });

      return { success: true, imported, errors };
    } catch (error) {
      return { success: false, imported: 0, errors: [error instanceof Error ? error.message : String(error)] };
    }
  }

  /**
   * Save custom rules to localStorage
   */
  private saveCustomRules(): void {
    try {
      const customRules = Array.from(this.rules.values());
      localStorage.setItem('ial-custom-rules', JSON.stringify(customRules));
    } catch (error) {
      console.warn('Failed to save custom rules:', error);
    }
  }

  /**
   * Load custom rules from localStorage
   */
  private loadCustomRules(): void {
    try {
      const stored = localStorage.getItem('ial-custom-rules');
      if (stored) {
        const customRules = JSON.parse(stored) as NLPRule[];
        customRules.forEach(rule => {
          this.rules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.warn('Failed to load custom rules:', error);
    }
  }
}

