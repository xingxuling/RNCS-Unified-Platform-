// THE SEED v1.0 - Universe Class
// Single universe instance with tick loop

import { Universe as IUniverse, World, Agent, Rule, Event, RuntimeStats } from './types';
import { EventManager } from './EventManager';
import { AetherLogicEngine } from './AetherLogicEngine';
import { SoulEngine } from './SoulEngine';
import { FateWeaver } from './FateWeaver';

export class Universe {
  private data: IUniverse;
  private worlds: Map<string, World> = new Map();
  private agents: Map<string, Agent> = new Map();
  private eventManager: EventManager;
  private aetherEngine: AetherLogicEngine;
  private soulEngine: SoulEngine;
  private fateWeaver: FateWeaver;
  private tickInterval: NodeJS.Timeout | null = null;
  private tickCallbacks: Set<() => void> = new Set();

  constructor(data: IUniverse) {
    this.data = data;
    this.eventManager = new EventManager();
    this.aetherEngine = new AetherLogicEngine();
    this.soulEngine = new SoulEngine();
    this.fateWeaver = new FateWeaver();
    this.fateWeaver.createGraph(data.id);
  }

  // ========================================================================
  // UNIVERSE CONTROL
  // ========================================================================

  start(): void {
    if (this.data.status === 'running') return;
    
    this.data.status = 'running';
    this.tickInterval = setInterval(() => {
      this.tick();
    }, this.data.config.tickInterval);
  }

  pause(): void {
    this.data.status = 'paused';
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  resume(): void {
    if (this.data.status !== 'paused') return;
    this.start();
  }

  // ========================================================================
  // TICK LOOP - CORE RUNTIME
  // ========================================================================

  private tick(): void {
    if (this.data.status !== 'running') return;

    this.data.currentTick++;

    // 遍历所有世界执行 tick
    for (const world of this.worlds.values()) {
      this.worldTick(world);
    }

    // FateWeaver Tick - 跨世界命运处理
    this.fateWeaverTick();

    // 通知监听器
    this.tickCallbacks.forEach(cb => cb());
  }

  // FateWeaver Tick - 命运层处理
  private fateWeaverTick(): void {
    const allWorlds = Array.from(this.worlds.values());
    const allAgents = Array.from(this.agents.values());
    const allEvents: Event[] = [];

    allWorlds.forEach(world => {
      allEvents.push(...this.eventManager.fetchUnprocessed(world.id));
    });

    const fateEvents = this.fateWeaver.tick(
      this.data.id,
      allWorlds,
      allAgents,
      allEvents
    );

    // 将命运事件分发到对应世界
    fateEvents.forEach(event => {
      this.eventManager.enqueue(event);
    });

    // 检查是否需要分支宇宙
    fateEvents.forEach(event => {
      if (event.type === 'fate_branch_universe') {
        // TODO: 触发宇宙分支（需要通过 UniverseManager）
        console.log('Universe branch triggered by fate!', event.payload);
      }
    });
  }

  // WorldTick - 单世界运行循环
  private worldTick(world: World): void {
    world.time.tick++;
    
    // 1. 获取未处理的输入事件
    const inputEvents = this.eventManager.fetchUnprocessed(world.id);

    // 2. 应用规则（Aether Logic）
    const ruleEvents = this.aetherEngine.applyRules(world, inputEvents);
    this.eventManager.enqueueBatch(ruleEvents);

    // 3. 更新所有 Agent（Soul Engine）
    const worldAgents = Array.from(this.agents.values()).filter(a => a.worldId === world.id);
    worldAgents.forEach(agent => {
      const agentEvents = this.soulEngine.updateAgent(world, agent, inputEvents);
      this.eventManager.enqueueBatch(agentEvents);
    });

    // 4. 标记事件为已处理
    inputEvents.forEach(event => {
      this.eventManager.markProcessed(event.id, world.id);
    });

    // 5. 更新世界状态
    this.updateWorldState(world, inputEvents);

    // 6. 周期性清理旧事件
    if (world.time.tick % 1000 === 0) {
      this.eventManager.cleanup(world.id, world.time.tick - 500);
    }
  }

  private updateWorldState(world: World, events: Event[]): void {
    // 基于事件更新世界状态
    events.forEach(event => {
      if (event.type === 'world_entropy_increase') {
        world.state.entropy = Math.min(100, world.state.entropy + 1);
      }
    });

    // 自然熵增
    if (world.time.tick % 100 === 0) {
      world.state.entropy = Math.min(100, world.state.entropy + 0.1);
    }
  }

  // ========================================================================
  // WORLD MANAGEMENT
  // ========================================================================

  createWorld(name: string, layer: World['layer'] = 'base'): World {
    const world: World = {
      id: crypto.randomUUID(),
      universeId: this.data.id,
      name,
      layer,
      state: {
        id: crypto.randomUUID(),
        name,
        status: 'initializing',
        entropy: 0,
        causalWeight: 1.0,
        timestamp: Date.now(),
        resources: {},
        globalVariables: {},
      },
      rulesetId: 'default',
      time: {
        tick: 0,
        cycle: 0,
        timestamp: Date.now(),
      },
      agentIds: [],
    };

    this.worlds.set(world.id, world);
    this.eventManager.createQueue(world.id);

    setTimeout(() => {
      world.state.status = 'active';
    }, 500);

    return world;
  }

  getWorld(worldId: string): World | undefined {
    return this.worlds.get(worldId);
  }

  getWorlds(): World[] {
    return Array.from(this.worlds.values());
  }

  // ========================================================================
  // AGENT MANAGEMENT
  // ========================================================================

  spawnAgent(worldId: string, name: string, kind: Agent['kind']): Agent {
    const world = this.worlds.get(worldId);
    if (!world) throw new Error('World not found');

    // 创建灵魂
    const soul = this.soulEngine.createSoul(name);

    const agent: Agent = {
      id: crypto.randomUUID(),
      worldId,
      kind,
      name,
      soulProfileId: soul.id,
      state: {
        position: { x: Math.random() * 1000, y: Math.random() * 1000 },
        attributes: {},
        flags: new Set(),
      },
      fateNodes: [],
    };

    this.agents.set(agent.id, agent);
    world.agentIds.push(agent.id);

    return agent;
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAgents(worldId?: string): Agent[] {
    const agents = Array.from(this.agents.values());
    return worldId ? agents.filter(a => a.worldId === worldId) : agents;
  }

  // ========================================================================
  // RULE MANAGEMENT
  // ========================================================================

  addRule(rule: Rule): void {
    this.aetherEngine.registerRule(rule);
  }

  getRules(worldId: string): Rule[] {
    return this.aetherEngine.getRules(worldId);
  }

  // ========================================================================
  // FATE WEAVER ACCESS
  // ========================================================================

  getFateWeaver(): FateWeaver {
    return this.fateWeaver;
  }

  // ========================================================================
  // EVENT SYSTEM
  // ========================================================================

  createEvent(
    worldId: string,
    type: string,
    payload: any,
    sourceAgentId?: string,
    targetAgentId?: string
  ): Event {
    const world = this.worlds.get(worldId);
    if (!world) throw new Error('World not found');

    return this.eventManager.createEvent(
      worldId,
      type,
      payload,
      world.time.tick,
      sourceAgentId,
      targetAgentId
    );
  }

  // ========================================================================
  // OBSERVERS & HOOKS
  // ========================================================================

  onTick(callback: () => void): () => void {
    this.tickCallbacks.add(callback);
    return () => this.tickCallbacks.delete(callback);
  }

  // ========================================================================
  // STATE EXPORT
  // ========================================================================

  getData(): IUniverse {
    return { ...this.data };
  }

  getStats(): RuntimeStats {
    return {
      totalTicks: this.data.currentTick,
      ticksPerSecond: 1000 / this.data.config.tickInterval,
      activeUniverses: 1,
      activeWorlds: this.worlds.size,
      activeAgents: this.agents.size,
      eventsProcessed: 0, // TODO: track
      rulesExecuted: 0, // TODO: track
      averageTickDuration: 0, // TODO: track
    };
  }

  exportState() {
    return {
      universe: this.data,
      worlds: Array.from(this.worlds.values()),
      agents: Array.from(this.agents.values()),
      souls: this.soulEngine.getAllSouls(),
      eventLog: this.eventManager.fetchUnprocessed(this.data.rootWorldId),
      aetherLog: this.aetherEngine.getLog(),
      soulLog: this.soulEngine.getLog(),
      fateLog: this.fateWeaver.getLog(),
      fateGraph: this.fateWeaver.exportGraph(this.data.id),
    };
  }
}
