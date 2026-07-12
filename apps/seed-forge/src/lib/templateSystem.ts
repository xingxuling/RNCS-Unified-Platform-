import yaml from 'js-yaml';
import { WorldState, Entity, CausalNode } from './worldEngine';

export interface WorldTemplate {
  version: string;
  metadata: {
    name: string;
    description: string;
    author: string;
    created: string;
    tags: string[];
  };
  worlds: WorldState[];
  entities: Entity[];
  causalNodes: CausalNode[];
  rules?: {
    id: string;
    type: string;
    condition: string;
    action: string;
  }[];
  eventLog?: string[];
}

export class TemplateSystem {
  // Export current state as template
  static exportTemplate(
    name: string,
    description: string,
    author: string,
    exportData: {
      worlds: WorldState[];
      entities: Entity[];
      causalNodes: CausalNode[];
      eventLog: string[];
    }
  ): WorldTemplate {
    return {
      version: '0.5.0',
      metadata: {
        name,
        description,
        author,
        created: new Date().toISOString(),
        tags: ['custom'],
      },
      worlds: exportData.worlds,
      entities: exportData.entities,
      causalNodes: exportData.causalNodes,
      eventLog: exportData.eventLog,
    };
  }

  // Convert template to YAML
  static toYAML(template: WorldTemplate): string {
    return yaml.dump(template, {
      indent: 2,
      lineWidth: -1,
    });
  }

  // Convert template to JSON
  static toJSON(template: WorldTemplate): string {
    return JSON.stringify(template, null, 2);
  }

  // Parse YAML to template
  static fromYAML(yamlString: string): WorldTemplate {
    return yaml.load(yamlString) as WorldTemplate;
  }

  // Parse JSON to template
  static fromJSON(jsonString: string): WorldTemplate {
    return JSON.parse(jsonString) as WorldTemplate;
  }

  // Download template as file
  static downloadTemplate(template: WorldTemplate, format: 'yaml' | 'json' = 'yaml') {
    const content = format === 'yaml' ? this.toYAML(template) : this.toJSON(template);
    const blob = new Blob([content], { type: format === 'yaml' ? 'text/yaml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.metadata.name.toLowerCase().replace(/\s+/g, '-')}-seed-v0.5.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get starter templates
  static getStarterTemplates(): WorldTemplate[] {
    return [
      {
        version: '0.5.0',
        metadata: {
          name: 'Genesis - Empty Universe',
          description: 'A blank slate for creating your own universe from scratch',
          author: 'Aetherion Protocol',
          created: '2025-11-30T00:00:00Z',
          tags: ['starter', 'blank'],
        },
        worlds: [],
        entities: [],
        causalNodes: [],
      },
      {
        version: '0.5.0',
        metadata: {
          name: 'Mythic Realm',
          description: 'A fantasy world with ancient magic and reincarnation cycles',
          author: 'Aetherion Protocol',
          created: '2025-11-30T00:00:00Z',
          tags: ['fantasy', 'magic', 'starter'],
        },
        worlds: [
          {
            id: 'mythic-001',
            name: 'The Eternal Realm',
            status: 'active' as const,
            entropy: 0.2,
            causalWeight: 1.5,
            timestamp: Date.now(),
          },
        ],
        entities: [
          {
            id: 'entity-001',
            name: 'The Sage',
            consciousness: 95.0,
            fateNodes: [],
            position: { x: 500, y: 500 },
          },
          {
            id: 'entity-002',
            name: 'The Wanderer',
            consciousness: 70.0,
            fateNodes: [],
            position: { x: 300, y: 700 },
          },
        ],
        causalNodes: [
          {
            id: 'node-001',
            type: 'CREATE',
            description: 'The world awakens from the void',
            weight: 1.0,
            connections: ['node-002'],
            executed: true,
          },
          {
            id: 'node-002',
            type: 'WEAVE',
            description: 'Threads of destiny intertwine',
            weight: 0.8,
            connections: ['node-003'],
            executed: true,
          },
          {
            id: 'node-003',
            type: 'LOOP',
            description: 'The cycle of reincarnation begins',
            weight: 0.9,
            connections: [],
            executed: true,
          },
        ],
      },
      {
        version: '0.5.0',
        metadata: {
          name: 'Quantum Nexus',
          description: 'A sci-fi universe with quantum branching and parallel timelines',
          author: 'Aetherion Protocol',
          created: '2025-11-30T00:00:00Z',
          tags: ['sci-fi', 'quantum', 'starter'],
        },
        worlds: [
          {
            id: 'quantum-alpha',
            name: 'Timeline Alpha',
            status: 'active' as const,
            entropy: 0.5,
            causalWeight: 1.0,
            timestamp: Date.now(),
          },
          {
            id: 'quantum-beta',
            name: 'Timeline Beta [Branch]',
            status: 'active' as const,
            entropy: 0.7,
            causalWeight: 0.8,
            timestamp: Date.now(),
          },
        ],
        entities: [
          {
            id: 'ai-001',
            name: 'Nexus Core AI',
            consciousness: 99.9,
            fateNodes: [],
            position: { x: 450, y: 450 },
          },
        ],
        causalNodes: [
          {
            id: 'q-node-001',
            type: 'CREATE',
            description: 'Quantum field initialization',
            weight: 1.0,
            connections: ['q-node-002'],
            executed: true,
          },
          {
            id: 'q-node-002',
            type: 'SHIFT',
            description: 'Timeline divergence detected',
            weight: 0.95,
            connections: ['q-node-003', 'q-node-004'],
            executed: true,
          },
          {
            id: 'q-node-003',
            type: 'BREAK',
            description: 'Reality fracture in Timeline Alpha',
            weight: 0.6,
            connections: [],
            executed: false,
          },
          {
            id: 'q-node-004',
            type: 'WEAVE',
            description: 'Parallel universes begin to merge',
            weight: 0.85,
            connections: [],
            executed: false,
          },
        ],
      },
    ];
  }

  // Validate template structure
  static validateTemplate(template: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.version) errors.push('Missing version');
    if (!template.metadata) errors.push('Missing metadata');
    if (!template.worlds) errors.push('Missing worlds array');
    if (!template.entities) errors.push('Missing entities array');
    if (!template.causalNodes) errors.push('Missing causalNodes array');

    if (template.metadata) {
      if (!template.metadata.name) errors.push('Missing metadata.name');
      if (!template.metadata.description) errors.push('Missing metadata.description');
      if (!template.metadata.author) errors.push('Missing metadata.author');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
