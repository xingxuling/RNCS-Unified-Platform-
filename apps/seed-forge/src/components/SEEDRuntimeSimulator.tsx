import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, RotateCcw, Download, Upload } from 'lucide-react';
import { SEEDRuntime, createSEEDRuntime, WorldState } from '@/lib/seed-rt';
import { UniverseForgeAdapter } from '@/lib/seed-rt/UniverseForgeAdapter';
import { toast } from 'sonner';

export const SEEDRuntimeSimulator = () => {
  const [runtime, setRuntime] = useState<SEEDRuntime | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [currentState, setCurrentState] = useState<WorldState | null>(null);
  const [convergenceHistory, setConvergenceHistory] = useState<number[]>([]);

  // Initialize runtime
  useEffect(() => {
    const initialState = UniverseForgeAdapter.createInitialWorldState('universe-001');
    const rt = createSEEDRuntime(initialState, {
      mainlineNodeId: 'mainline-杜浩麟',
      convergenceThreshold: 0.9,
      maxActiveTimelines: 100,
      cycleTimeLimit: 100,
      enableAutoRecovery: true,
    });
    setRuntime(rt);
    setCurrentState(rt.getWorldState());
  }, []);

  const handleStart = async () => {
    if (!runtime) return;

    try {
      await runtime.start();
      setIsRunning(true);
      toast.success('运行时已启动');
    } catch (error) {
      toast.error('启动失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleStop = () => {
    if (!runtime) return;

    runtime.stop();
    setIsRunning(false);
    toast.info('运行时已停止');
  };

  const handleStep = async () => {
    if (!runtime || !isRunning) return;

    try {
      const result = await runtime.executeCycle();
      setCycleCount(result.cycleNumber);
      setCurrentState(result.worldState);
      
      // Update convergence history
      setConvergenceHistory(prev => [...prev, result.convergenceCheck.globalConvergence]);

      // Check termination
      if (result.convergenceCheck.requiresCorrection) {
        toast.warning('检测到收敛度偏离，已触发校正事件');
      }

      const termination = runtime.getTerminationCondition();
      if (termination) {
        setIsRunning(false);
        toast.success('运行时终止', {
          description: termination.description,
        });
      }
    } catch (error) {
      toast.error('循环执行失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleRunCycles = async (count: number) => {
    if (!runtime || !isRunning) return;

    try {
      const results = await runtime.executeCycles(count);
      if (results.length > 0) {
        const lastResult = results[results.length - 1];
        setCycleCount(lastResult.cycleNumber);
        setCurrentState(lastResult.worldState);
        
        // Update convergence history
        const convergences = results.map(r => r.convergenceCheck.globalConvergence);
        setConvergenceHistory(prev => [...prev, ...convergences]);

        const termination = runtime.getTerminationCondition();
        if (termination) {
          setIsRunning(false);
          toast.success('运行时终止', {
            description: termination.description,
          });
        }
      }
    } catch (error) {
      toast.error('批量执行失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleReset = () => {
    if (!runtime) return;

    const initialState = UniverseForgeAdapter.createInitialWorldState('universe-001');
    const rt = createSEEDRuntime(initialState, {
      mainlineNodeId: 'mainline-杜浩麟',
      convergenceThreshold: 0.9,
      maxActiveTimelines: 100,
      cycleTimeLimit: 100,
      enableAutoRecovery: true,
    });
    setRuntime(rt);
    setCurrentState(rt.getWorldState());
    setCycleCount(0);
    setConvergenceHistory([]);
    setIsRunning(false);
    toast.info('运行时已重置');
  };

  const handleExport = () => {
    if (!runtime) return;

    try {
      const data = runtime.exportWorldState();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seed-runtime-state-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('状态已导出');
    } catch (error) {
      toast.error('导出失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !runtime) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        runtime.importWorldState(data);
        setCurrentState(runtime.getWorldState());
        toast.success('状态已导入');
      } catch (error) {
        toast.error('导入失败', {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>SEED-RT 运行时模拟器</CardTitle>
          <Badge variant="outline">v1</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleStart}
            disabled={isRunning || !runtime}
            variant="default"
          >
            <Play className="w-4 h-4 mr-2" />
            启动
          </Button>
          <Button
            onClick={handleStop}
            disabled={!isRunning}
            variant="outline"
          >
            <Pause className="w-4 h-4 mr-2" />
            停止
          </Button>
          <Button
            onClick={handleStep}
            disabled={!isRunning}
            variant="outline"
          >
            <Square className="w-4 h-4 mr-2" />
            单步执行
          </Button>
          <Button
            onClick={() => handleRunCycles(10)}
            disabled={!isRunning}
            variant="outline"
          >
            执行 10 循环
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
          <Button
            onClick={handleExport}
            disabled={!runtime}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <label className="px-3 py-2 bg-secondary border border-border rounded cursor-pointer hover:bg-accent">
            <Upload className="w-4 h-4 inline mr-2" />
            导入
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {/* Status */}
        {currentState && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="timelines">时间线</TabsTrigger>
              <TabsTrigger value="entities">实体</TabsTrigger>
              <TabsTrigger value="convergence">收敛度</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">循环次数</div>
                  <div className="text-2xl font-bold">{cycleCount}</div>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">时间索引</div>
                  <div className="text-2xl font-bold">{currentState.timeIndex}</div>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">活跃时间线</div>
                  <div className="text-2xl font-bold">
                    {currentState.activeTimelines.filter(t => t.status === 'Active').length}
                  </div>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">实体数量</div>
                  <div className="text-2xl font-bold">{currentState.entities.length}</div>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">文明数量</div>
                  <div className="text-2xl font-bold">{currentState.civilizations.length}</div>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">以太密度</div>
                  <div className="text-2xl font-bold">
                    {(currentState.globalParameters.aetherDensity * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Timelines */}
            <TabsContent value="timelines" className="space-y-2">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentState.activeTimelines.map((timeline) => (
                  <Card key={timeline.timelineId} className="p-3 bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{timeline.timelineId}</div>
                        <div className="text-sm text-muted-foreground">
                          状态: {timeline.status} | 收敛度: {(timeline.convergenceScore * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          路径长度: {timeline.pathHistory.length}
                        </div>
                      </div>
                      <Badge variant={timeline.status === 'Active' ? 'default' : 'secondary'}>
                        {timeline.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Entities */}
            <TabsContent value="entities" className="space-y-2">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentState.entities.map((entity) => (
                  <Card key={entity.entityId} className="p-3 bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {entity.identityProfile?.name || entity.entityId}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          类型: {entity.type} | 
                          BTOS: {entity.mindProfile?.btosLevel || 'N/A'} |
                          收敛度: {(entity.fateVector.convergenceScore * 100).toFixed(0)}%
                        </div>
                      </div>
                      {entity.identityProfile?.nodeClass && (
                        <Badge variant="outline">{entity.identityProfile.nodeClass}</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Convergence */}
            <TabsContent value="convergence" className="space-y-2">
              <div className="p-4 bg-secondary/30 rounded">
                <div className="text-sm text-muted-foreground mb-2">收敛度历史</div>
                <div className="h-48 flex items-end gap-1">
                  {convergenceHistory.slice(-50).map((conv, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary"
                      style={{
                        height: `${(conv + 1) * 50}%`,
                        minHeight: '2px',
                      }}
                      title={`循环 ${i + 1}: ${(conv * 100).toFixed(0)}%`}
                    />
                  ))}
                </div>
                {convergenceHistory.length > 0 && (
                  <div className="mt-2 text-sm">
                    当前收敛度: {(convergenceHistory[convergenceHistory.length - 1] * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

