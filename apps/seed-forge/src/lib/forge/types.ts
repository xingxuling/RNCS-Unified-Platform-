// THE SEED v2.0 - Universe Forge Types

/**
 * Universe Template
 */
export interface UniverseTemplate {
  id: string;
  name: string;
  description: string;
  ialExpression: string;
  worlds: WorldTemplate[];
  rules: RuleTemplate[];
  fateNodes: FateNodeTemplate[];
  tags: string[];
  metadata: Record<string, any>;
}

/**
 * World Template
 */
export interface WorldTemplate {
  name: string;
  ialExpression: string;
  structure: {
    dimensions: number[];
    type: 'grid' | 'graph' | 'tree' | 'custom';
    [key: string]: any;
  };
  metadata?: Record<string, any>;
}

/**
 * Rule Template
 */
export interface RuleTemplate {
  name: string;
  ialExpression: string;
  priority: number;
  conditions?: any[];
  metadata?: Record<string, any>;
}

/**
 * Fate Node Template
 */
export interface FateNodeTemplate {
  name: string;
  type: 'origin' | 'mainline' | 'branch' | 'exploration' | 'convergence';
  convergence: number;
  metadata?: Record<string, any>;
}

