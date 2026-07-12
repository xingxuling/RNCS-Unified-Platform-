// THE SEED v1.0 - Fate Weaver
// Destiny graph execution and universe branching

import { FateNode, FateGraph, Event, World, Universe as IUniverse, Agent } from './types';

export class FateWeaver {
  private graphs: Map<string, FateGraph> = new Map();
  private executionLog: string[] = [];

  // ========================================================================
  // FATE GRAPH MANAGEMENT
  // ========================================================================

  createGraph(universeId: string): FateGraph {
    const graph: FateGraph = {
      universeId,
      nodes: new Map(),
      activeNodeIds: [],
    };

    this.graphs.set(universeId, graph);
    this.log(`Fate graph created for universe ${universeId}`);
    return graph;
  }

  getGraph(universeId: string): FateGraph | undefined {
    return this.graphs.get(universeId);
  }

  // ========================================================================
  // FATE NODE MANAGEMENT
  // ========================================================================

  createNode(
    universeId: string,
    label: string,
    description: string,
    importance: number = 50
  ): FateNode {
    let graph = this.graphs.get(universeId);
    if (!graph) {
      graph = this.createGraph(universeId);
    }

    const node: FateNode = {
      id: crypto.randomUUID(),
      universeId,
      label,
      description,
      conditions: [],
      effects: [],
      importance,
      weight: Math.random(),
      nextNodeIds: [],
      executed: false,
      executionCount: 0,
    };

    graph.nodes.set(node.id, node);
    this.log(`Fate node created: ${label} [${node.id.slice(0, 8)}]`);
    return node;
  }

  addNode(node: FateNode): void {
    let graph = this.graphs.get(node.universeId);
    if (!graph) {
      graph = this.createGraph(node.universeId);
    }

    graph.nodes.set(node.id, node);
    this.log(`Fate node added: ${node.label}`);
  }

  getNode(universeId: string, nodeId: string): FateNode | undefined {
    const graph = this.graphs.get(universeId);
    return graph?.nodes.get(nodeId);
  }

  getAllNodes(universeId: string): FateNode[] {
    const graph = this.graphs.get(universeId);
    return graph ? Array.from(graph.nodes.values()) : [];
  }

  // 连接节点
  connectNodes(universeId: string, fromNodeId: string, toNodeId: string): void {
    const fromNode = this.getNode(universeId, fromNodeId);
    const toNode = this.getNode(universeId, toNodeId);

    if (!fromNode || !toNode) {
      this.log(`Cannot connect nodes: one or both not found`);
      return;
    }

    if (!fromNode.nextNodeIds.includes(toNodeId)) {
      fromNode.nextNodeIds.push(toNodeId);
      this.log(`Connected ${fromNode.label} -> ${toNode.label}`);
    }
  }

  // 断开节点
  disconnectNodes(universeId: string, fromNodeId: string, toNodeId: string): void {
    const fromNode = this.getNode(universeId, fromNodeId);
    if (!fromNode) return;

    fromNode.nextNodeIds = fromNode.nextNodeIds.filter(id => id !== toNodeId);
    this.log(`Disconnected nodes`);
  }

  // 激活节点
  activateNode(universeId: string, nodeId: string): void {
    const graph = this.graphs.get(universeId);
    if (!graph) return;

    if (!graph.activeNodeIds.includes(nodeId)) {
      graph.activeNodeIds.push(nodeId);
      this.log(`Fate node activated: ${nodeId.slice(0, 8)}`);
    }
  }

  // 停用节点
  deactivateNode(universeId: string, nodeId: string): void {
    const graph = this.graphs.get(universeId);
    if (!graph) return;

    graph.activeNodeIds = graph.activeNodeIds.filter(id => id !== nodeId);
    this.log(`Fate node deactivated: ${nodeId.slice(0, 8)}`);
  }

  // ========================================================================
  // FATE EXECUTION - CORE TICK
  // ========================================================================

  tick(universeId: string, worlds: World[], agents: Agent[], events: Event[]): Event[] {
    const graph = this.graphs.get(universeId);
    if (!graph) return [];

    const fateEvents: Event[] = [];

    // 遍历所有活跃的命运节点
    for (const nodeId of graph.activeNodeIds) {
      const node = graph.nodes.get(nodeId);
      if (!node || node.executed) continue;

      // 检查条件是否满足
      if (this.checkConditions(node, worlds, agents, events)) {
        // 执行命运效果
        const effects = this.executeNode(node, worlds, agents);
        fateEvents.push(...effects);

        // 标记已执行
        node.executed = true;
        node.executionCount++;

        // 激活下一个节点
        node.nextNodeIds.forEach(nextId => {
          this.activateNode(universeId, nextId);
        });

        this.log(`🎲 Fate node executed: ${node.label} [Importance: ${node.importance}]`);
      }
    }

    return fateEvents;
  }

  // 检查条件
  private checkConditions(
    node: FateNode,
    worlds: World[],
    agents: Agent[],
    events: Event[]
  ): boolean {
    if (node.conditions.length === 0) return true;

    return node.conditions.every(condition => {
      const value = this.resolveConditionValue(condition.field, worlds, agents, events);
      return this.evaluateCondition(value, condition.operator, condition.value);
    });
  }

  // 解析条件值
  private resolveConditionValue(
    field: string,
    worlds: World[],
    agents: Agent[],
    events: Event[]
  ): any {
    const parts = field.split('.');

    // world.count, world.entropy, etc
    if (parts[0] === 'world') {
      if (parts[1] === 'count') return worlds.length;
      if (parts[1] === 'entropy' && worlds.length > 0) {
        return worlds[0].state.entropy;
      }
    }

    // agent.count, agent.kind.npc, etc
    if (parts[0] === 'agent') {
      if (parts[1] === 'count') return agents.length;
      if (parts[1] === 'kind' && parts[2]) {
        return agents.filter(a => a.kind === parts[2]).length;
      }
    }

    // event.type.xxx, event.count, etc
    if (parts[0] === 'event') {
      if (parts[1] === 'count') return events.length;
      if (parts[1] === 'type' && parts[2]) {
        return events.filter(e => e.type === parts[2]).length;
      }
    }

    return undefined;
  }

  // 评估条件
  private evaluateCondition(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return value === expected;
      case 'gt':
        return value > expected;
      case 'lt':
        return value < expected;
      case 'gte':
        return value >= expected;
      case 'lte':
        return value <= expected;
      case 'contains':
        return String(value).includes(String(expected));
      case 'matches':
        return new RegExp(expected).test(String(value));
      default:
        return false;
    }
  }

  // 执行节点效果
  private executeNode(node: FateNode, worlds: World[], agents: Agent[]): Event[] {
    const events: Event[] = [];

    node.effects.forEach(effect => {
      switch (effect.type) {
        case 'modify_state':
          this.log(`  ↳ Modifying state: ${effect.target}`);
          // 修改世界状态
          if (worlds.length > 0) {
            const world = worlds[0];
            events.push({
              id: crypto.randomUUID(),
              worldId: world.id,
              type: 'fate_state_modified',
              timestamp: Date.now(),
              tick: world.time.tick,
              payload: { nodeId: node.id, effect },
              processed: false,
            });
          }
          break;

        case 'spawn_entity':
          this.log(`  ↳ Spawning entity: ${effect.params.name || 'Unknown'}`);
          if (worlds.length > 0) {
            const world = worlds[0];
            events.push({
              id: crypto.randomUUID(),
              worldId: world.id,
              type: 'fate_spawn_entity',
              timestamp: Date.now(),
              tick: world.time.tick,
              payload: { nodeId: node.id, entityParams: effect.params },
              processed: false,
            });
          }
          break;

        case 'trigger_event':
          this.log(`  ↳ Triggering event: ${effect.params.eventType || 'custom'}`);
          if (worlds.length > 0) {
            const world = worlds[0];
            events.push({
              id: crypto.randomUUID(),
              worldId: world.id,
              type: effect.params.eventType || 'fate_custom_event',
              timestamp: Date.now(),
              tick: world.time.tick,
              payload: { nodeId: node.id, ...effect.params },
              processed: false,
            });
          }
          break;

        case 'branch_universe':
          this.log(`  ↳ Universe branch triggered!`);
          if (worlds.length > 0) {
            const world = worlds[0];
            events.push({
              id: crypto.randomUUID(),
              worldId: world.id,
              type: 'fate_branch_universe',
              timestamp: Date.now(),
              tick: world.time.tick,
              payload: { nodeId: node.id, branchConfig: effect.params },
              processed: false,
            });
          }
          break;

        case 'custom':
          this.log(`  ↳ Custom effect: ${JSON.stringify(effect.params)}`);
          break;
      }
    });

    return events;
  }

  // ========================================================================
  // FATE INGESTION (from events)
  // ========================================================================

  ingest(universeId: string, events: Event[]): void {
    const graph = this.graphs.get(universeId);
    if (!graph) return;

    // 检查事件是否匹配未激活的节点
    events.forEach(event => {
      graph.nodes.forEach(node => {
        if (graph.activeNodeIds.includes(node.id)) return;
        if (node.executed) return;

        // 简单匹配：如果事件类型在节点描述中
        if (node.description.toLowerCase().includes(event.type.toLowerCase())) {
          this.activateNode(universeId, node.id);
        }
      });
    });
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  resetNode(universeId: string, nodeId: string): void {
    const node = this.getNode(universeId, nodeId);
    if (node) {
      node.executed = false;
      this.log(`Fate node reset: ${node.label}`);
    }
  }

  resetAllNodes(universeId: string): void {
    const graph = this.graphs.get(universeId);
    if (!graph) return;

    graph.nodes.forEach(node => {
      node.executed = false;
    });

    graph.activeNodeIds = [];
    this.log(`All fate nodes reset for universe ${universeId.slice(0, 8)}`);
  }

  getLog(): string[] {
    return [...this.executionLog];
  }

  clearLog(): void {
    this.executionLog = [];
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.executionLog.push(`[${timestamp}] ${message}`);
  }

  // ========================================================================
  // EXPORT / IMPORT
  // ========================================================================

  exportGraph(universeId: string): any {
    const graph = this.graphs.get(universeId);
    if (!graph) return null;

    return {
      universeId,
      nodes: Array.from(graph.nodes.values()),
      activeNodeIds: graph.activeNodeIds,
    };
  }

  importGraph(data: any): void {
    const graph: FateGraph = {
      universeId: data.universeId,
      nodes: new Map(data.nodes.map((n: FateNode) => [n.id, n])),
      activeNodeIds: data.activeNodeIds || [],
    };

    this.graphs.set(data.universeId, graph);
    this.log(`Fate graph imported for universe ${data.universeId.slice(0, 8)}`);
  }
}
