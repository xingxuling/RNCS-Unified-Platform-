// THE SEED v0.5 - World Engine Core
// Aetherion Logic Implementation

export type AetherionOperator = 'CREATE' | 'LOOP' | 'BREAK' | 'SHIFT' | 'WEAVE';

export interface WorldState {
  id: string;
  name: string;
  status: 'initializing' | 'active' | 'paused' | 'collapsed';
  entropy: number;
  causalWeight: number;
  timestamp: number;
}

export interface CausalNode {
  id: string;
  type: AetherionOperator;
  description: string;
  weight: number;
  connections: string[];
  executed: boolean;
}

export interface Entity {
  id: string;
  name: string;
  consciousness: number;
  fateNodes: string[];
  position: { x: number; y: number };
}

export class WorldEngine {
  private worlds: Map<string, WorldState> = new Map();
  private causalGraph: Map<string, CausalNode> = new Map();
  private entities: Map<string, Entity> = new Map();
  private eventLog: string[] = [];

  // Reality Kernel - Core State Management
  createWorld(name: string): WorldState {
    const world: WorldState = {
      id: crypto.randomUUID(),
      name,
      status: 'initializing',
      entropy: 0,
      causalWeight: 1.0,
      timestamp: Date.now(),
    };
    
    this.worlds.set(world.id, world);
    this.log(`CREATE: World "${name}" initialized [${world.id}]`);
    
    setTimeout(() => {
      world.status = 'active';
      this.log(`SHIFT: World "${name}" transitioned to active state`);
    }, 1000);
    
    return world;
  }

  // Aether Logic Layer - Causal Operations
  executeCausal(operator: AetherionOperator, target: string, params?: any): void {
    const node: CausalNode = {
      id: crypto.randomUUID(),
      type: operator,
      description: `${operator} operation on ${target}`,
      weight: Math.random(),
      connections: [],
      executed: false,
    };

    this.causalGraph.set(node.id, node);

    switch (operator) {
      case 'CREATE':
        this.log(`⚡ CREATE: Manifesting ${target}`);
        break;
      case 'LOOP':
        this.log(`🔄 LOOP: Iteration cycle on ${target}`);
        break;
      case 'BREAK':
        this.log(`💥 BREAK: Dissolution of ${target}`);
        break;
      case 'SHIFT':
        this.log(`🌀 SHIFT: State transition for ${target}`);
        break;
      case 'WEAVE':
        this.log(`🕸️ WEAVE: Connecting causal threads for ${target}`);
        break;
    }

    node.executed = true;
  }

  // Soul Engine - Entity Management
  spawnEntity(name: string, worldId: string): Entity {
    const entity: Entity = {
      id: crypto.randomUUID(),
      name,
      consciousness: Math.random() * 100,
      fateNodes: [],
      position: {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
      },
    };

    this.entities.set(entity.id, entity);
    this.log(`👤 Entity spawned: ${name} [Consciousness: ${entity.consciousness.toFixed(1)}]`);
    
    return entity;
  }

  // Fate Weaving Layer
  createFateNode(entityId: string, description: string): string {
    const entity = this.entities.get(entityId);
    if (!entity) return '';

    const nodeId = crypto.randomUUID();
    entity.fateNodes.push(nodeId);
    
    const node: CausalNode = {
      id: nodeId,
      type: 'WEAVE',
      description,
      weight: Math.random(),
      connections: [],
      executed: false,
    };

    this.causalGraph.set(nodeId, node);
    this.log(`🎲 Fate node created for ${entity.name}: ${description}`);
    
    return nodeId;
  }

  // Universe Branching
  branchUniverse(sourceWorldId: string, deviation: string): WorldState {
    const sourceWorld = this.worlds.get(sourceWorldId);
    if (!sourceWorld) throw new Error('Source world not found');

    const branchedWorld = this.createWorld(`${sourceWorld.name} [Branch: ${deviation}]`);
    branchedWorld.causalWeight = sourceWorld.causalWeight * 0.8;
    
    this.log(`🌌 Universe branched from ${sourceWorld.name} with deviation: ${deviation}`);
    
    return branchedWorld;
  }

  // State Export
  exportState() {
    return {
      worlds: Array.from(this.worlds.values()),
      causalNodes: Array.from(this.causalGraph.values()),
      entities: Array.from(this.entities.values()),
      eventLog: [...this.eventLog],
    };
  }

  // Event Log
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.eventLog.push(`[${timestamp}] ${message}`);
    
    // 限制日志最大长度，防止内存泄漏
    // 当超过1000条时，只保留最新的500条
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-500);
    }
  }

  getEventLog(): string[] {
    return [...this.eventLog];
  }

  getWorlds(): WorldState[] {
    return Array.from(this.worlds.values());
  }

  getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  getCausalGraph(): CausalNode[] {
    return Array.from(this.causalGraph.values());
  }
}

// Singleton instance
export const worldEngine = new WorldEngine();
