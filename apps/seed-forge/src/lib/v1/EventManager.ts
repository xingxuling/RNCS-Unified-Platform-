// THE SEED v1.0 - Event Manager
// Handles event queuing and processing

import { Event, EventQueue } from './types';

export class EventManager {
  private queues: Map<string, EventQueue> = new Map();
  private readonly DEFAULT_MAX_SIZE = 10000;

  // 创建事件队列
  createQueue(worldId: string, maxSize: number = this.DEFAULT_MAX_SIZE): void {
    if (!this.queues.has(worldId)) {
      this.queues.set(worldId, {
        worldId,
        events: [],
        maxSize,
      });
    }
  }

  // 添加事件
  enqueue(event: Event): void {
    const queue = this.queues.get(event.worldId);
    if (!queue) {
      this.createQueue(event.worldId);
      return this.enqueue(event);
    }

    queue.events.push(event);

    // 限制队列大小
    if (queue.events.length > queue.maxSize) {
      queue.events.shift();
    }
  }

  // 批量添加事件
  enqueueBatch(events: Event[]): void {
    events.forEach(event => this.enqueue(event));
  }

  // 获取未处理的事件
  fetchUnprocessed(worldId: string): Event[] {
    const queue = this.queues.get(worldId);
    if (!queue) return [];

    return queue.events.filter(e => !e.processed);
  }

  // 标记事件为已处理
  markProcessed(eventId: string, worldId: string): void {
    const queue = this.queues.get(worldId);
    if (!queue) return;

    const event = queue.events.find(e => e.id === eventId);
    if (event) {
      event.processed = true;
    }
  }

  // 创建新事件
  createEvent(
    worldId: string,
    type: string,
    payload: any,
    tick: number,
    sourceAgentId?: string,
    targetAgentId?: string
  ): Event {
    const event: Event = {
      id: crypto.randomUUID(),
      worldId,
      type,
      timestamp: Date.now(),
      tick,
      payload,
      sourceAgentId,
      targetAgentId,
      processed: false,
    };

    this.enqueue(event);
    return event;
  }

  // 清理旧事件
  cleanup(worldId: string, beforeTick: number): void {
    const queue = this.queues.get(worldId);
    if (!queue) return;

    queue.events = queue.events.filter(e => e.tick >= beforeTick);
  }

  // 获取事件统计
  getStats(worldId: string) {
    const queue = this.queues.get(worldId);
    if (!queue) return null;

    return {
      total: queue.events.length,
      unprocessed: queue.events.filter(e => !e.processed).length,
      processed: queue.events.filter(e => e.processed).length,
    };
  }

  // 清空队列
  clearQueue(worldId: string): void {
    const queue = this.queues.get(worldId);
    if (queue) {
      queue.events = [];
    }
  }
}
