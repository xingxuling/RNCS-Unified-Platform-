// THE SEED v1.5 - Universe Persistence Integration
// 将 Universe 系统与持久化层集成

import { Universe } from '../v1/Universe';
import { UniverseManager } from '../v1/UniverseManager';
import { persistenceManager } from './Database';
import { logger } from '@/utils/logger';

/**
 * 增强的 Universe Manager，支持自动保存
 */
export class PersistentUniverseManager extends UniverseManager {
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private autoSaveEnabled: boolean = false;
  private autoSaveDelay: number = 30000; // 30秒

  /**
   * 启用自动保存
   */
  enableAutoSave(delay: number = 30000): void {
    if (this.autoSaveEnabled) return;
    
    this.autoSaveEnabled = true;
    this.autoSaveDelay = delay;
    
    this.autoSaveInterval = setInterval(() => {
      this.autoSaveAll();
    }, delay);
    
    logger.log('Auto-save enabled');
  }

  /**
   * 禁用自动保存
   */
  disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    this.autoSaveEnabled = false;
    logger.log('Auto-save disabled');
  }

  /**
   * 自动保存所有宇宙
   */
  private async autoSaveAll(): Promise<void> {
    try {
      const universes = this.getUniverses();
      for (const universe of universes) {
        await this.saveUniverse(universe);
      }
      logger.log(`Auto-saved ${universes.length} universes`);
    } catch (error) {
      logger.error('Auto-save failed:', error);
    }
  }

  /**
   * 保存单个宇宙
   */
  async saveUniverse(universe: Universe): Promise<void> {
    try {
      const data = universe.getData();
      await persistenceManager.saveUniverse(data);
      logger.log(`Universe saved: ${data.name}`);
    } catch (error) {
      logger.error('Failed to save universe:', error);
      throw error;
    }
  }

  /**
   * 从持久化存储加载所有宇宙
   */
  async loadAllUniverses(): Promise<Universe[]> {
    try {
      const savedUniverses = await persistenceManager.getAllUniverses();
      const loaded: Universe[] = [];

      for (const universeData of savedUniverses) {
        // 创建 Universe 实例
        const universe = new Universe(universeData);
        
        // 恢复状态
        // TODO: 实现完整的状态恢复逻辑
        
        loaded.push(universe);
      }

      logger.log(`Loaded ${loaded.length} universes from storage`);
      return loaded;
    } catch (error) {
      logger.error('Failed to load universes:', error);
      throw error;
    }
  }

  /**
   * 重写 createUniverse 以自动保存
   */
  override createUniverse(name: string, config?: Partial<import('../v1/types').UniverseConfig>): Universe {
    const universe = super.createUniverse(name, config);
    
    // 异步保存（不阻塞）
    this.saveUniverse(universe).catch(error => {
      logger.error('Failed to save newly created universe:', error);
    });
    
    return universe;
  }

  /**
   * 重写 deleteUniverse 以删除持久化数据
   */
  override deleteUniverse(universeId: string): boolean {
    const result = super.deleteUniverse(universeId);
    
    if (result) {
      // 异步删除持久化数据
      persistenceManager.deleteUniverse(universeId).catch(error => {
        logger.error('Failed to delete universe from storage:', error);
      });
    }
    
    return result;
  }

  /**
   * 重写 takeSnapshot 以持久化快照
   */
  override takeSnapshot(universeId: string, label: string = 'Manual Snapshot'): import('../v1/types').UniverseSnapshot | null {
    const snapshot = super.takeSnapshot(universeId, label);
    
    if (snapshot) {
      // 异步保存快照
      persistenceManager.saveSnapshot(snapshot).catch(error => {
        logger.error('Failed to save snapshot:', error);
      });
    }
    
    return snapshot;
  }
}

