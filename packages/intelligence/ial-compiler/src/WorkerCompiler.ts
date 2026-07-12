// THE SEED v2.0 - IAL Worker Compiler
// Manages Web Worker-based parallel compilation

import { CompilationResult } from './Compiler';

/**
 * Worker Compiler Manager
 */
export class IALWorkerCompiler {
  private workers: Worker[] = [];
  private maxWorkers: number;
  private pendingTasks: Map<string, {
    resolve: (result: CompilationResult) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private workerIndex: number = 0;

  constructor(maxWorkers: number = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = Math.min(maxWorkers, 8); // Cap at 8 workers
    this.initializeWorkers();
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(
        new URL('./ialCompiler.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event) => {
        this.handleWorkerMessage(event.data);
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
      };

      this.workers.push(worker);
    }
  }

  /**
   * Compile IAL in worker
   */
  compile(source: string): Promise<CompilationResult> {
    return new Promise((resolve, reject) => {
      const taskId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.pendingTasks.set(taskId, { resolve, reject });

      // Get next available worker
      const worker = this.getNextWorker();
      
      // Send compile request
      worker.postMessage({
        type: 'compile',
        id: taskId,
        source,
      });
    });
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(data: any): void {
    const task = this.pendingTasks.get(data.id);
    if (!task) return;

    this.pendingTasks.delete(data.id);

    if (data.success) {
      task.resolve({
        success: true,
        compiled: data.compiled,
        ast: data.ast,
        errors: data.errors || [],
        enhancedErrors: data.enhancedErrors || [],
        warnings: data.warnings || [],
      });
    } else {
      task.resolve({
        success: false,
        ast: data.ast,
        errors: data.errors || [],
        enhancedErrors: data.enhancedErrors || [],
        warnings: data.warnings || [],
      });
    }
  }

  /**
   * Get next available worker (round-robin)
   */
  private getNextWorker(): Worker {
    const worker = this.workers[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workers.length;
    return worker;
  }

  /**
   * Compile multiple sources in parallel
   */
  async compileBatch(sources: string[]): Promise<CompilationResult[]> {
    return Promise.all(sources.map(source => this.compile(source)));
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.pendingTasks.clear();
  }
}

