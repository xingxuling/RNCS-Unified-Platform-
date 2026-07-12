// THE SEED v1.5 - Worker Manager
// 管理 Web Workers 池，用于并行计算

import { Event, World } from '../v1/types';

/**
 * Worker 池配置
 */
interface WorkerPoolConfig {
  maxWorkers: number;
  workerScript: string;
}

/**
 * Worker 任务
 */
interface WorkerTask {
  id: string;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}

/**
 * Worker 管理器
 * 管理 Web Workers 池，实现任务队列和负载均衡
 */
export class WorkerManager {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{
    task: WorkerTask;
    message: any;
  }> = [];
  private config: WorkerPoolConfig;

  constructor(config: WorkerPoolConfig) {
    this.config = config;
    this.initializeWorkers();
  }

  /**
   * 初始化 Worker 池
   */
  private initializeWorkers(): void {
    const workerCount = Math.min(
      this.config.maxWorkers,
      navigator.hardwareConcurrency || 4
    );

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(
        new URL('../../workers/eventProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.addEventListener('message', (event) => {
        this.handleWorkerMessage(worker, event.data);
      });

      worker.addEventListener('error', (error) => {
        console.error('Worker error:', error);
        this.handleWorkerError(worker, error);
      });

      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  /**
   * 处理 Worker 消息
   */
  private handleWorkerMessage(worker: Worker, response: any): void {
    // 将 Worker 标记为可用
    if (!this.availableWorkers.includes(worker)) {
      this.availableWorkers.push(worker);
    }

    // 处理队列中的下一个任务
    this.processNextTask();
  }

  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    console.error('Worker error:', error);
    // 可以重新创建 Worker 或从池中移除
  }

  /**
   * 处理队列中的下一个任务
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const { task, message } = this.taskQueue.shift()!;
    const worker = this.availableWorkers.shift()!;

    // 设置超时
    const timeout = setTimeout(() => {
      worker.terminate();
      // 重新创建 Worker
      const newWorker = new Worker(
        new URL('../../workers/eventProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );
      const index = this.workers.indexOf(worker);
      this.workers[index] = newWorker;
      this.availableWorkers.push(newWorker);
      
      task.reject(new Error('Worker task timeout'));
    }, 30000); // 30秒超时

    // 监听响应
    const messageHandler = (event: MessageEvent) => {
      clearTimeout(timeout);
      worker.removeEventListener('message', messageHandler);
      
      if (event.data.type === 'error') {
        task.reject(new Error(event.data.error));
      } else {
        task.resolve(event.data.payload);
      }
    };

    worker.addEventListener('message', messageHandler);
    worker.postMessage(message);
  }

  /**
   * 提交任务到 Worker 池
   */
  async submitTask<T>(message: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: WorkerTask = {
        id: crypto.randomUUID(),
        resolve,
        reject,
      };

      this.taskQueue.push({ task, message });
      this.processNextTask();
    });
  }

  /**
   * 处理事件（使用 Worker）
   */
  async processEvents(events: Event[], world: World): Promise<{
    processedEvents: Event[];
    newEvents: Event[];
  }> {
    return this.submitTask({
      type: 'processEvents',
      payload: { events, world },
    });
  }

  /**
   * 终止所有 Workers
   */
  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }

  /**
   * 获取 Worker 池状态
   */
  getStatus(): {
    totalWorkers: number;
    availableWorkers: number;
    queuedTasks: number;
  } {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      queuedTasks: this.taskQueue.length,
    };
  }
}

// 全局 Worker 管理器实例
export const workerManager = new WorkerManager({
  maxWorkers: Math.min(navigator.hardwareConcurrency || 4, 8),
  workerScript: '/workers/eventProcessor.worker.ts',
});

