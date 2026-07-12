// THE SEED v1.5 - Auto Save Manager
// 自动保存和恢复管理

import { Universe } from '../v1/Universe';
import { UniverseManager } from '../v1/UniverseManager';
import { persistenceManager } from '../persistence/Database';
import { logger } from '@/utils/logger';

/**
 * 自动保存配置
 */
interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // 毫秒
  saveBeforeUnload: boolean;
  maxSnapshots: number;
}

/**
 * 自动保存管理器
 */
export class AutoSaveManager {
  private config: AutoSaveConfig;
  private saveInterval: NodeJS.Timeout | null = null;
  private universeManager: UniverseManager;
  private lastSaveTime: number = 0;
  private isSaving: boolean = false;

  constructor(
    universeManager: UniverseManager,
    config: Partial<AutoSaveConfig> = {}
  ) {
    this.universeManager = universeManager;
    this.config = {
      enabled: config.enabled ?? false,
      interval: config.interval ?? 30000, // 默认30秒
      saveBeforeUnload: config.saveBeforeUnload ?? true,
      maxSnapshots: config.maxSnapshots ?? 100,
    };

    if (this.config.saveBeforeUnload) {
      this.setupBeforeUnload();
    }
  }

  /**
   * 启用自动保存
   */
  enable(): void {
    if (this.config.enabled) return;

    this.config.enabled = true;
    this.startAutoSave();
    logger.log('Auto-save enabled');
  }

  /**
   * 禁用自动保存
   */
  disable(): void {
    if (!this.config.enabled) return;

    this.config.enabled = false;
    this.stopAutoSave();
    logger.log('Auto-save disabled');
  }

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    if (this.saveInterval) return;

    // 立即保存一次
    this.saveAll();

    // 设置定时保存
    this.saveInterval = setInterval(() => {
      this.saveAll();
    }, this.config.interval);
  }

  /**
   * 停止自动保存
   */
  private stopAutoSave(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
  }

  /**
   * 保存所有宇宙
   */
  async saveAll(): Promise<void> {
    if (this.isSaving) {
      logger.warn('Save already in progress, skipping');
      return;
    }

    this.isSaving = true;
    const startTime = performance.now();

    try {
      const universes = this.universeManager.getUniverses();
      
      // 并行保存所有宇宙
      await Promise.all(
        universes.map(async (universe) => {
          try {
            const data = universe.getData();
            await persistenceManager.saveUniverse(data);
          } catch (error) {
            logger.error(`Failed to save universe ${universe.getData().id}:`, error);
          }
        })
      );

      const duration = performance.now() - startTime;
      this.lastSaveTime = Date.now();
      
      logger.log(`Auto-saved ${universes.length} universes in ${duration.toFixed(2)}ms`);
    } catch (error) {
      logger.error('Auto-save failed:', error);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * 设置页面卸载前保存
   */
  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', async () => {
      if (this.isSaving) {
        // 如果正在保存，等待完成（最多等待2秒）
        const startTime = Date.now();
        while (this.isSaving && Date.now() - startTime < 2000) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        // 快速保存
        await this.saveAll();
      }
    });

    // 页面可见性变化时保存
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.config.enabled) {
        this.saveAll();
      }
    });
  }

  /**
   * 恢复所有宇宙
   */
  async restoreAll(): Promise<Universe[]> {
    try {
      const savedUniverses = await persistenceManager.getAllUniverses();
      const restored: Universe[] = [];

      for (const universeData of savedUniverses) {
        try {
          // 创建 Universe 实例
          const universe = new Universe(universeData);
          
          // TODO: 恢复完整状态（世界、Agent、规则等）
          // 这需要实现完整的状态序列化/反序列化
          
          restored.push(universe);
          logger.log(`Restored universe: ${universeData.name}`);
        } catch (error) {
          logger.error(`Failed to restore universe ${universeData.id}:`, error);
        }
      }

      logger.log(`Restored ${restored.length} universes`);
      return restored;
    } catch (error) {
      logger.error('Restore failed:', error);
      throw error;
    }
  }

  /**
   * 获取最后保存时间
   */
  getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  /**
   * 检查是否有未保存的更改
   */
  hasUnsavedChanges(): boolean {
    // 简单实现：如果距离上次保存超过间隔时间，认为有未保存更改
    if (this.lastSaveTime === 0) return true;
    return Date.now() - this.lastSaveTime > this.config.interval;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AutoSaveConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...config };

    if (this.config.enabled !== wasEnabled) {
      if (this.config.enabled) {
        this.enable();
      } else {
        this.disable();
      }
    } else if (this.config.enabled && config.interval) {
      // 如果间隔时间改变，重启自动保存
      this.stopAutoSave();
      this.startAutoSave();
    }
  }

  /**
   * 获取配置
   */
  getConfig(): AutoSaveConfig {
    return { ...this.config };
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.disable();
  }
}

