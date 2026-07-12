// THE SEED v1.5 - Crash Recovery
// 崩溃恢复机制

import { persistenceManager } from '../persistence/Database';
import { UniverseSnapshot } from '../v1/types';
import { logger } from '@/utils/logger';

/**
 * 崩溃恢复信息
 */
interface CrashRecoveryInfo {
  timestamp: number;
  error: string;
  universeId?: string;
  snapshotId?: string;
}

/**
 * 崩溃恢复管理器
 */
export class CrashRecovery {
  private recoveryKey = 'seed_crash_recovery';
  private lastHealthCheck: number = Date.now();
  private healthCheckInterval: number = 5000; // 5秒

  constructor() {
    this.setupHealthCheck();
    this.checkForCrash();
  }

  /**
   * 检查是否有崩溃
   */
  private async checkForCrash(): Promise<void> {
    try {
      const recoveryInfo = await this.getRecoveryInfo();
      
      if (recoveryInfo) {
        logger.warn('Detected previous crash, attempting recovery...');
        await this.recover(recoveryInfo);
      } else {
        // 标记系统正常启动
        await this.markHealthy();
      }
    } catch (error) {
      logger.error('Crash recovery check failed:', error);
    }
  }

  /**
   * 设置健康检查
   */
  private setupHealthCheck(): void {
    // 定期更新健康标记
    setInterval(() => {
      this.markHealthy();
    }, this.healthCheckInterval);

    // 页面卸载前标记
    window.addEventListener('beforeunload', () => {
      this.markHealthy();
    });

    // 错误监听
    window.addEventListener('error', (event) => {
      this.handleError(event.error);
    });

    // 未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
    });
  }

  /**
   * 处理错误
   */
  private async handleError(error: Error | unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Unhandled error detected:', error);

    // 保存崩溃信息
    await this.saveRecoveryInfo({
      timestamp: Date.now(),
      error: errorMessage,
    });

    // 尝试自动保存
    try {
      // 这里可以触发紧急保存
      // await autoSaveManager.saveAll();
    } catch (saveError) {
      logger.error('Emergency save failed:', saveError);
    }
  }

  /**
   * 标记系统健康
   */
  private async markHealthy(): Promise<void> {
    try {
      // 清除恢复信息，表示系统正常运行
      await persistenceManager.saveSetting(this.recoveryKey, '');
      this.lastHealthCheck = Date.now();
    } catch (error) {
      logger.error('Failed to mark healthy:', error);
    }
  }

  /**
   * 获取恢复信息
   */
  private async getRecoveryInfo(): Promise<CrashRecoveryInfo | null> {
    try {
      const recoveryData = await persistenceManager.getSetting(this.recoveryKey);
      if (!recoveryData) return null;

      return JSON.parse(recoveryData) as CrashRecoveryInfo;
    } catch (error) {
      logger.error('Failed to get recovery info:', error);
      return null;
    }
  }

  /**
   * 保存恢复信息
   */
  private async saveRecoveryInfo(info: CrashRecoveryInfo): Promise<void> {
    try {
      await persistenceManager.saveSetting(
        this.recoveryKey,
        JSON.stringify(info)
      );
    } catch (error) {
      logger.error('Failed to save recovery info:', error);
    }
  }

  /**
   * 恢复系统
   */
  private async recover(info: CrashRecoveryInfo): Promise<void> {
    try {
      logger.log('Starting recovery process...');

      // 如果有快照 ID，尝试恢复快照
      if (info.snapshotId) {
        // TODO: 实现快照恢复逻辑
        logger.log(`Attempting to restore snapshot: ${info.snapshotId}`);
      }

      // 如果有宇宙 ID，尝试恢复宇宙
      if (info.universeId) {
        // TODO: 实现宇宙恢复逻辑
        logger.log(`Attempting to restore universe: ${info.universeId}`);
      }

      // 清除恢复信息
      await this.markHealthy();

      logger.log('Recovery completed');
    } catch (error) {
      logger.error('Recovery failed:', error);
    }
  }

  /**
   * 创建恢复点（快照）
   */
  async createRecoveryPoint(universeId: string): Promise<UniverseSnapshot | null> {
    try {
      // 获取最新快照作为恢复点
      const snapshot = await persistenceManager.getLatestSnapshot(universeId);
      
      if (snapshot) {
        await this.saveRecoveryInfo({
          timestamp: Date.now(),
          error: 'Manual recovery point',
          universeId,
          snapshotId: snapshot.id,
        });
        
        logger.log(`Recovery point created for universe ${universeId}`);
        return snapshot;
      }

      return null;
    } catch (error) {
      logger.error('Failed to create recovery point:', error);
      return null;
    }
  }

  /**
   * 验证数据完整性
   */
  async validateDataIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const universes = await persistenceManager.getAllUniverses();
      
      for (const universe of universes) {
        // 检查基本字段
        if (!universe.id || !universe.name) {
          issues.push(`Universe ${universe.id} has missing required fields`);
        }

        // 检查快照
        const snapshots = await persistenceManager.getSnapshots(universe.id);
        for (const snapshot of snapshots) {
          if (!snapshot.id || !snapshot.universeId) {
            issues.push(`Snapshot ${snapshot.id} has missing required fields`);
          }
        }
      }
    } catch (error) {
      issues.push(`Data integrity check failed: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

// 全局崩溃恢复管理器实例
export const crashRecovery = new CrashRecovery();

