// THE SEED v1.5 - Event Processor Worker
// 在 Web Worker 中处理事件，避免阻塞主线程

import { Event, World } from '../lib/v1/types';

/**
 * Worker 消息类型
 */
export interface WorkerMessage {
  type: 'processEvents' | 'ping';
  payload?: {
    events: Event[];
    world: World;
  };
}

/**
 * Worker 响应类型
 */
export interface WorkerResponse {
  type: 'eventsProcessed' | 'pong' | 'error';
  payload?: {
    processedEvents: Event[];
    newEvents: Event[];
  };
  error?: string;
}

// 监听主线程消息
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'ping':
        self.postMessage({ type: 'pong' } as WorkerResponse);
        break;

      case 'processEvents':
        if (payload) {
          const result = await processEvents(payload.events, payload.world);
          self.postMessage({
            type: 'eventsProcessed',
            payload: result,
          } as WorkerResponse);
        }
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as WorkerResponse);
  }
});

/**
 * 处理事件（在 Worker 中执行）
 */
async function processEvents(
  events: Event[],
  world: World
): Promise<{
  processedEvents: Event[];
  newEvents: Event[];
}> {
  const processedEvents: Event[] = [];
  const newEvents: Event[] = [];

  // 模拟事件处理逻辑
  // 在实际应用中，这里会调用 AetherLogicEngine 等
  for (const event of events) {
    // 标记为已处理
    const processed = { ...event, processed: true };
    processedEvents.push(processed);

    // 根据事件类型生成新事件
    if (event.type === 'agent_action') {
      // 示例：Agent 行动可能触发其他事件
      newEvents.push({
        id: crypto.randomUUID(),
        worldId: world.id,
        type: 'world_state_changed',
        timestamp: Date.now(),
        tick: world.time.tick,
        payload: { sourceEvent: event.id },
        processed: false,
      });
    }
  }

  return { processedEvents, newEvents };
}

