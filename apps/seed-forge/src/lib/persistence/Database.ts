// THE SEED v1.5 - Persistence Layer
// IndexedDB storage using Dexie

import Dexie, { Table } from 'dexie';
import { UniverseSnapshot } from '../v1/types';
import { Universe as IUniverse } from '../v1/types';

/**
 * 数据库模式定义
 */
export interface DatabaseSchema {
  universes: IUniverse;
  snapshots: UniverseSnapshot;
  settings: {
    id?: number;
    key: string;
    value: string;
  };
}

/**
 * THE SEED 数据库类
 */
export class SeedDatabase extends Dexie {
  universes!: Table<IUniverse, string>;
  snapshots!: Table<UniverseSnapshot, string>;
  settings!: Table<{ id?: number; key: string; value: string }, number>;

  constructor() {
    super('SeedDatabase');
    
    this.version(1).stores({
      universes: 'id, name, createdAt, status',
      snapshots: 'id, universeId, timestamp, tick, label',
      settings: '++id, key',
    });
  }
}

// 全局数据库实例
export const db = new SeedDatabase();

/**
 * 数据库工具类
 */
export class PersistenceManager {
  /**
   * 保存宇宙数据
   */
  async saveUniverse(universe: IUniverse): Promise<void> {
    try {
      await db.universes.put(universe);
    } catch (error) {
      console.error('Failed to save universe:', error);
      throw error;
    }
  }

  /**
   * 获取所有宇宙
   */
  async getAllUniverses(): Promise<IUniverse[]> {
    return await db.universes.toArray();
  }

  /**
   * 获取单个宇宙
   */
  async getUniverse(universeId: string): Promise<IUniverse | undefined> {
    return await db.universes.get(universeId);
  }

  /**
   * 删除宇宙
   */
  async deleteUniverse(universeId: string): Promise<void> {
    await db.universes.delete(universeId);
    // 同时删除相关快照
    await db.snapshots.where('universeId').equals(universeId).delete();
  }

  /**
   * 保存快照
   */
  async saveSnapshot(snapshot: UniverseSnapshot): Promise<void> {
    try {
      await db.snapshots.put(snapshot);
      
      // 限制每个宇宙的快照数量（保留最新100个）
      const snapshots = await db.snapshots
        .where('universeId')
        .equals(snapshot.universeId)
        .sortBy('timestamp');
      
      if (snapshots.length > 100) {
        const toDelete = snapshots.slice(0, snapshots.length - 100);
        await db.snapshots.bulkDelete(toDelete.map(s => s.id));
      }
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      throw error;
    }
  }

  /**
   * 获取宇宙的所有快照
   */
  async getSnapshots(universeId: string): Promise<UniverseSnapshot[]> {
    return await db.snapshots
      .where('universeId')
      .equals(universeId)
      .sortBy('timestamp');
  }

  /**
   * 获取最新快照
   */
  async getLatestSnapshot(universeId: string): Promise<UniverseSnapshot | undefined> {
    const snapshots = await db.snapshots
      .where('universeId')
      .equals(universeId)
      .sortBy('timestamp');
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : undefined;
  }

  /**
   * 删除快照
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    await db.snapshots.delete(snapshotId);
  }

  /**
   * 保存设置
   */
  async saveSetting(key: string, value: string): Promise<void> {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) {
      await db.settings.update(existing.id!, { value });
    } else {
      await db.settings.add({ key, value });
    }
  }

  /**
   * 获取设置
   */
  async getSetting(key: string): Promise<string | undefined> {
    const setting = await db.settings.where('key').equals(key).first();
    return setting?.value;
  }

  /**
   * 导出所有数据（用于备份）
   */
  async exportData(): Promise<{
    universes: IUniverse[];
    snapshots: UniverseSnapshot[];
    settings: { key: string; value: string }[];
  }> {
    return {
      universes: await db.universes.toArray(),
      snapshots: await db.snapshots.toArray(),
      settings: await db.settings.toArray(),
    };
  }

  /**
   * 导入数据（用于恢复）
   */
  async importData(data: {
    universes?: IUniverse[];
    snapshots?: UniverseSnapshot[];
    settings?: { key: string; value: string }[];
  }): Promise<void> {
    await db.transaction('rw', db.universes, db.snapshots, db.settings, async () => {
      if (data.universes) {
        await db.universes.bulkPut(data.universes);
      }
      if (data.snapshots) {
        await db.snapshots.bulkPut(data.snapshots);
      }
      if (data.settings) {
        await db.settings.bulkPut(data.settings.map(s => ({ ...s, id: undefined })));
      }
    });
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    await db.transaction('rw', db.universes, db.snapshots, db.settings, async () => {
      await db.universes.clear();
      await db.snapshots.clear();
      await db.settings.clear();
    });
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{
    universeCount: number;
    snapshotCount: number;
    totalSize: number;
  }> {
    const universes = await db.universes.toArray();
    const snapshots = await db.snapshots.toArray();
    
    // 估算数据大小（粗略）
    const totalSize = 
      JSON.stringify(universes).length +
      JSON.stringify(snapshots).length;
    
    return {
      universeCount: universes.length,
      snapshotCount: snapshots.length,
      totalSize,
    };
  }
}

// 全局持久化管理器实例
export const persistenceManager = new PersistenceManager();

