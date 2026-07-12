import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Cpu, HardDrive, AlertTriangle } from 'lucide-react';
import { performanceMonitor } from '@/lib/performance/PerformanceMonitor';

export const PerformanceMonitor = () => {
  const [stats, setStats] = useState(performanceMonitor.getStats());
  const [health, setHealth] = useState(performanceMonitor.isHealthy());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats());
      setHealth(performanceMonitor.isHealthy());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle>性能监控</CardTitle>
          </div>
          <Badge variant={health.healthy ? 'default' : 'destructive'}>
            {health.healthy ? (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                健康
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                警告
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 性能指标 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Tick 持续时间</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatTime(stats.averageTickDuration)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              目标: &lt;16ms (60 FPS)
            </div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">事件处理</span>
            </div>
            <div className="text-2xl font-bold text-accent">
              {formatTime(stats.averageEventProcessingTime)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              平均处理时间
            </div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-consciousness" />
              <span className="text-xs text-muted-foreground">渲染时间</span>
            </div>
            <div className="text-2xl font-bold text-consciousness">
              {formatTime(stats.averageRenderTime)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              平均渲染时间
            </div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-foreground" />
              <span className="text-xs text-muted-foreground">内存使用</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.peakMemoryUsage > 0 
                ? formatBytes(stats.peakMemoryUsage)
                : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              峰值内存使用
            </div>
          </div>
        </div>

        {/* FPS 显示 */}
        <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold mb-1">帧率 (FPS)</div>
              <div className="text-3xl font-bold text-primary">
                {stats.averageFps > 0 ? stats.averageFps.toFixed(1) : 'N/A'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">总 Tick 数</div>
              <div className="text-xl font-bold">{stats.totalTicks}</div>
            </div>
          </div>
        </div>

        {/* 健康问题 */}
        {!health.healthy && health.issues.length > 0 && (
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">性能问题</span>
            </div>
            <ul className="text-xs text-destructive space-y-1">
              {health.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              performanceMonitor.clear();
              setStats(performanceMonitor.getStats());
            }}
            className="px-4 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded border border-border transition-colors"
          >
            清空统计
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

