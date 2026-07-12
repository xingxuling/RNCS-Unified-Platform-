// THE SEED v1.0 - Universe Manager
// Multi-universe orchestration and scheduling

import { Universe as IUniverse, UniverseConfig, UniverseSnapshot, RuntimeStats } from './types';
import { Universe } from './Universe';

export class UniverseManager {
  private universes: Map<string, Universe> = new Map();
  private snapshots: Map<string, UniverseSnapshot[]> = new Map();
  private globalTick: number = 0;
  private systemLog: string[] = [];

  // ========================================================================
  // UNIVERSE LIFECYCLE
  // ========================================================================

  createUniverse(
    name: string,
    config: Partial<UniverseConfig> = {}
  ): Universe {
    const defaultConfig: UniverseConfig = {
      tickInterval: 1000,
      timeScale: 1.0,
      physicsMode: 'newtonian',
      maxWorlds: 100,
      enableAutoSave: true,
      metadata: {},
    };

    const universeData: IUniverse = {
      id: crypto.randomUUID(),
      name,
      seed: crypto.randomUUID(),
      createdAt: Date.now(),
      config: { ...defaultConfig, ...config },
      rootWorldId: '',
      status: 'initializing',
      currentTick: 0,
      metadata: {},
    };

    const universe = new Universe(universeData);
    
    // 创建根世界
    const rootWorld = universe.createWorld(`${name} - Root World`);
    universeData.rootWorldId = rootWorld.id;
    universeData.status = 'paused';

    this.universes.set(universeData.id, universe);
    this.log(`Universe created: ${name} [${universeData.id}]`);

    return universe;
  }

  // 获取宇宙
  getUniverse(universeId: string): Universe | undefined {
    return this.universes.get(universeId);
  }

  // 获取所有宇宙
  getUniverses(): Universe[] {
    return Array.from(this.universes.values());
  }

  // 删除宇宙
  deleteUniverse(universeId: string): boolean {
    const universe = this.universes.get(universeId);
    if (!universe) return false;

    universe.pause();
    this.universes.delete(universeId);
    this.log(`Universe deleted: ${universeId}`);
    return true;
  }

  // ========================================================================
  // UNIVERSE BRANCHING
  // ========================================================================

  branchUniverse(
    sourceUniverseId: string,
    branchName: string,
    deviation?: string
  ): Universe | null {
    const sourceUniverse = this.universes.get(sourceUniverseId);
    if (!sourceUniverse) return null;

    // 创建快照
    const snapshot = this.takeSnapshot(sourceUniverseId, `Branch: ${branchName}`);
    if (!snapshot) return null;

    // 创建新宇宙
    const sourceData = sourceUniverse.getData();
    const branchedUniverse = this.createUniverse(
      `${sourceData.name} [${branchName}]`,
      {
        ...sourceData.config,
        timeScale: sourceData.config.timeScale * 0.9, // 分支宇宙时间稍慢
      }
    );

    // TODO: 恢复快照数据到新宇宙

    this.log(`Universe branched: ${sourceData.name} → ${branchName}`);
    return branchedUniverse;
  }

  // ========================================================================
  // SNAPSHOT & PERSISTENCE
  // ========================================================================

  takeSnapshot(universeId: string, label: string = 'Manual Snapshot'): UniverseSnapshot | null {
    const universe = this.universes.get(universeId);
    if (!universe) return null;

    const state = universe.exportState();
    const snapshot: UniverseSnapshot = {
      id: crypto.randomUUID(),
      universeId,
      timestamp: Date.now(),
      tick: state.universe.currentTick,
      label,
      worlds: state.worlds,
      agents: state.agents,
      rules: [], // TODO
      fateGraph: { universeId, nodes: new Map(), activeNodeIds: [] }, // TODO
      metadata: {},
    };

    const universeSnapshots = this.snapshots.get(universeId) || [];
    universeSnapshots.push(snapshot);
    this.snapshots.set(universeId, universeSnapshots);

    this.log(`Snapshot created: ${label} [${snapshot.id}]`);
    return snapshot;
  }

  getSnapshots(universeId: string): UniverseSnapshot[] {
    return this.snapshots.get(universeId) || [];
  }

  // ========================================================================
  // GLOBAL SCHEDULER (Phase 2)
  // ========================================================================

  // TODO: 实现多宇宙并发调度
  // 目前每个 Universe 独立运行自己的 tick loop

  // ========================================================================
  // RUNTIME STATS
  // ========================================================================

  getGlobalStats(): RuntimeStats {
    const allUniverses = Array.from(this.universes.values());
    
    const stats = {
      totalTicks: this.globalTick,
      ticksPerSecond: 0,
      activeUniverses: allUniverses.filter(u => u.getData().status === 'running').length,
      activeWorlds: 0,
      activeAgents: 0,
      eventsProcessed: 0,
      rulesExecuted: 0,
      averageTickDuration: 0,
    };

    allUniverses.forEach(universe => {
      const uStats = universe.getStats();
      stats.activeWorlds += uStats.activeWorlds;
      stats.activeAgents += uStats.activeAgents;
      stats.eventsProcessed += uStats.eventsProcessed;
      stats.rulesExecuted += uStats.rulesExecuted;
    });

    return stats;
  }

  // ========================================================================
  // SYSTEM LOG
  // ========================================================================

  getLog(): string[] {
    return [...this.systemLog];
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.systemLog.push(`[${timestamp}] ${message}`);
    // 使用 logger 工具（如果可用）
    if (typeof window !== 'undefined') {
      import('@/utils/logger').then(({ logger }) => {
        logger.log(`[UniverseManager] ${message}`);
      }).catch(() => {
        // 如果 logger 不可用，使用 console
    console.log(`[UniverseManager] ${message}`);
      });
    }
  }
}

// 全局单例
export const universeManager = new UniverseManager();
