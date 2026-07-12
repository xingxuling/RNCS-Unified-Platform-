// THE SEED v1.5 - Performance Monitor
// 性能监控和统计

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  tickDuration: number;
  eventProcessingTime: number;
  renderTime: number;
  memoryUsage: number;
  fps: number;
}

/**
 * 性能统计
 */
export interface PerformanceStats {
  averageTickDuration: number;
  averageEventProcessingTime: number;
  averageRenderTime: number;
  peakMemoryUsage: number;
  averageFps: number;
  totalTicks: number;
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxSamples: number = 1000;
  private tickStartTime: number = 0;
  private eventStartTime: number = 0;
  private renderStartTime: number = 0;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();

  /**
   * 开始测量 tick
   */
  startTick(): void {
    this.tickStartTime = performance.now();
  }

  /**
   * 结束测量 tick
   */
  endTick(): void {
    const duration = performance.now() - this.tickStartTime;
    this.recordMetric('tickDuration', duration);
  }

  /**
   * 开始测量事件处理
   */
  startEventProcessing(): void {
    this.eventStartTime = performance.now();
  }

  /**
   * 结束测量事件处理
   */
  endEventProcessing(): void {
    const duration = performance.now() - this.eventStartTime;
    this.recordMetric('eventProcessingTime', duration);
  }

  /**
   * 开始测量渲染
   */
  startRender(): void {
    this.renderStartTime = performance.now();
  }

  /**
   * 结束测量渲染
   */
  endRender(): void {
    const duration = performance.now() - this.renderStartTime;
    this.recordMetric('renderTime', duration);
    
    // 计算 FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      const fps = this.frameCount;
      this.recordMetric('fps', fps);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  }

  /**
   * 记录指标
   */
  private recordMetric(key: keyof PerformanceMetrics, value: number): void {
    // 获取或创建当前指标对象
    const currentMetric = this.metrics[this.metrics.length - 1] || {
      tickDuration: 0,
      eventProcessingTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      fps: 0,
    };

    // 更新指标
    currentMetric[key] = value;

    // 如果是新指标对象，添加到数组
    if (this.metrics.length === 0 || 
        this.metrics[this.metrics.length - 1] !== currentMetric) {
      this.metrics.push(currentMetric);
    }

    // 限制样本数量
    if (this.metrics.length > this.maxSamples) {
      this.metrics.shift();
    }

    // 更新内存使用（如果可用）
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      currentMetric.memoryUsage = memory.usedJSHeapSize;
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        averageTickDuration: 0,
        averageEventProcessingTime: 0,
        averageRenderTime: 0,
        peakMemoryUsage: 0,
        averageFps: 0,
        totalTicks: 0,
      };
    }

    const tickDurations = this.metrics
      .map(m => m.tickDuration)
      .filter(d => d > 0);
    const eventTimes = this.metrics
      .map(m => m.eventProcessingTime)
      .filter(t => t > 0);
    const renderTimes = this.metrics
      .map(m => m.renderTime)
      .filter(t => t > 0);
    const fpsValues = this.metrics
      .map(m => m.fps)
      .filter(f => f > 0);
    const memoryUsages = this.metrics
      .map(m => m.memoryUsage)
      .filter(m => m > 0);

    return {
      averageTickDuration: this.average(tickDurations),
      averageEventProcessingTime: this.average(eventTimes),
      averageRenderTime: this.average(renderTimes),
      peakMemoryUsage: Math.max(...memoryUsages, 0),
      averageFps: this.average(fpsValues),
      totalTicks: tickDurations.length,
    };
  }

  /**
   * 计算平均值
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 获取最近的指标
   */
  getRecentMetrics(count: number = 100): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * 清空统计数据
   */
  clear(): void {
    this.metrics = [];
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
  }

  /**
   * 检查性能是否健康
   */
  isHealthy(): {
    healthy: boolean;
    issues: string[];
  } {
    const stats = this.getStats();
    const issues: string[] = [];

    // 检查 tick 持续时间（应该 < 16ms 以保持 60 FPS）
    if (stats.averageTickDuration > 16) {
      issues.push(`Tick duration too high: ${stats.averageTickDuration.toFixed(2)}ms`);
    }

    // 检查 FPS（应该 > 50）
    if (stats.averageFps > 0 && stats.averageFps < 50) {
      issues.push(`Low FPS: ${stats.averageFps.toFixed(1)}`);
    }

    // 检查内存使用（如果可用）
    if (stats.peakMemoryUsage > 0) {
      const memoryMB = stats.peakMemoryUsage / 1024 / 1024;
      if (memoryMB > 500) {
        issues.push(`High memory usage: ${memoryMB.toFixed(2)}MB`);
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}

// 全局性能监控器实例
export const performanceMonitor = new PerformanceMonitor();

