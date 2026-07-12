// THE SEED v1.5 - Event Batcher
// 批量处理事件以提高性能

import { Event } from '../v1/types';

/**
 * 批处理配置
 */
interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // 毫秒
  flushOnIdle: boolean;
}

/**
 * 批处理回调函数类型
 */
type BatchProcessor<T> = (batch: T[]) => Promise<void> | void;

/**
 * 通用批处理器
 * 将多个操作合并为批次，减少处理次数
 */
export class EventBatcher<T = Event> {
  private batch: T[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private config: BatchConfig;
  private processor: BatchProcessor<T>;
  private isFlushing: boolean = false;

  constructor(
    processor: BatchProcessor<T>,
    config: Partial<BatchConfig> = {}
  ) {
    this.processor = processor;
    this.config = {
      maxBatchSize: config.maxBatchSize || 100,
      maxWaitTime: config.maxWaitTime || 100,
      flushOnIdle: config.flushOnIdle ?? true,
    };

    // 如果启用空闲刷新，监听页面可见性
    if (this.config.flushOnIdle) {
      this.setupIdleFlush();
    }
  }

  /**
   * 添加项目到批次
   */
  add(item: T): void {
    this.batch.push(item);

    // 如果批次达到最大大小，立即刷新
    if (this.batch.length >= this.config.maxBatchSize) {
      this.flush();
      return;
    }

    // 如果这是批次中的第一个项目，启动定时器
    if (this.batch.length === 1 && !this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.config.maxWaitTime);
    }
  }

  /**
   * 批量添加项目
   */
  addBatch(items: T[]): void {
    for (const item of items) {
      this.add(item);
    }
  }

  /**
   * 立即刷新批次
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.batch.length === 0) {
      return;
    }

    this.isFlushing = true;

    // 清除定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // 复制当前批次并清空
    const batchToProcess = [...this.batch];
    this.batch = [];

    try {
      // 处理批次
      await this.processor(batchToProcess);
    } catch (error) {
      console.error('Batch processing error:', error);
      // 错误时可以选择重新加入批次或丢弃
      // 这里选择丢弃，实际应用中可能需要更复杂的错误处理
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * 设置空闲时刷新
   */
  private setupIdleFlush(): void {
    // 使用 requestIdleCallback（如果可用）
    if ('requestIdleCallback' in window) {
      const scheduleIdleFlush = () => {
        requestIdleCallback(() => {
          if (this.batch.length > 0) {
            this.flush();
          }
          scheduleIdleFlush();
        });
      };
      scheduleIdleFlush();
    } else {
      // 降级到定时检查
      setInterval(() => {
        if (this.batch.length > 0 && document.hidden) {
          this.flush();
        }
      }, 1000);
    }
  }

  /**
   * 获取当前批次大小
   */
  getBatchSize(): number {
    return this.batch.length;
  }

  /**
   * 清空批次（不处理）
   */
  clear(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.batch = [];
  }

  /**
   * 销毁批处理器
   */
  destroy(): void {
    this.clear();
    this.isFlushing = false;
  }
}

/**
 * 事件批处理器（专门用于 Event）
 */
export class EventBatchProcessor extends EventBatcher<Event> {
  constructor(
    processor: BatchProcessor<Event>,
    config?: Partial<BatchConfig>
  ) {
    super(processor, config);
  }

  /**
   * 按世界 ID 分组处理
   */
  static createGroupedProcessor(
    processor: (worldId: string, events: Event[]) => Promise<void> | void
  ): BatchProcessor<Event> {
    return async (batch: Event[]) => {
      // 按世界 ID 分组
      const grouped = new Map<string, Event[]>();
      for (const event of batch) {
        const worldEvents = grouped.get(event.worldId) || [];
        worldEvents.push(event);
        grouped.set(event.worldId, worldEvents);
      }

      // 并行处理每个世界的批次
      await Promise.all(
        Array.from(grouped.entries()).map(([worldId, events]) =>
          processor(worldId, events)
        )
      );
    };
  }
}

