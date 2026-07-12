import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, RotateCcw, StepForward } from 'lucide-react';
import { SEEDRuntime, WorldState, RuntimeCycleResult, Timeline } from '@/seed-runtime';
import { UniverseForgeAdapter } from '@/seed-runtime/UniverseForgeAdapter';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const SEEDRuntimeVisualizer = () => {
  const [runtime, setRuntime] = useState<SEEDRuntime | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentState, setCurrentState] = useState<WorldState | null>(null);
  const [history, setHistory] = useState<RuntimeCycleResult[]>([]);
  const [convergenceHistory, setConvergenceHistory] = useState<Array<{ cycle: number; convergence: number }>>([]);
  const [timelineHistory, setTimelineHistory] = useState<Map<string, Array<{ cycle: number; nodeId: string; convergence: number }>>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize runtime
  useEffect(() => {
    const initialState = UniverseForgeAdapter.createInitialWorldState('universe-001', '杜浩麟');
    const rt = new SEEDRuntime(initialState, {
      mainlineOriginName: '杜浩麟',
      convergenceThreshold: 0.4,
      maxTimelines: 16,
    });
    setRuntime(rt);
    setCurrentState(rt.getWorldState());
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleStart = () => {
    if (!runtime) return;
    runtime.start();
    setIsRunning(true);
    
    intervalRef.current = setInterval(() => {
      handleStep();
    }, 500);
    
    toast.success('运行时已启动');
  };

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (runtime) {
      runtime.stop();
    }
    setIsRunning(false);
    toast.info('运行时已停止');
  };

  const handleStep = () => {
    if (!runtime || !isRunning) return;

    try {
      const result = runtime.executeCycle();
      const newState = result.worldState;
      
      setCurrentState(newState);
      setHistory(prev => [...prev, result]);

      // Update convergence history
      const activeTimelines = newState.activeTimelines.filter(t => t.status === 'ACTIVE');
      const avgConvergence = activeTimelines.length > 0
        ? activeTimelines.reduce((sum, t) => sum + t.convergenceScore, 0) / activeTimelines.length
        : 0;

      setConvergenceHistory(prev => [...prev, {
        cycle: newState.timeIndex,
        convergence: avgConvergence,
      }]);

      // Update timeline history
      const newTimelineHistory = new Map(timelineHistory);
      newState.activeTimelines.forEach(tl => {
        if (!newTimelineHistory.has(tl.id)) {
          newTimelineHistory.set(tl.id, []);
        }
        const history = newTimelineHistory.get(tl.id)!;
        history.push({
          cycle: newState.timeIndex,
          nodeId: tl.currentNodeId,
          convergence: tl.convergenceScore,
        });
        newTimelineHistory.set(tl.id, history);
      });
      setTimelineHistory(newTimelineHistory);

      // Show events
      if (result.triggeredEvents.length > 0) {
        result.triggeredEvents.forEach(evt => {
          toast.info(evt.name, {
            description: evt.description,
          });
        });
      }
    } catch (error) {
      toast.error('循环执行失败', {
        description: error instanceof Error ? error.message : String(error),
      });
      handleStop();
    }
  };

  const handleReset = () => {
    handleStop();
    const initialState = UniverseForgeAdapter.createInitialWorldState('universe-001', '杜浩麟');
    const rt = new SEEDRuntime(initialState, {
      mainlineOriginName: '杜浩麟',
      convergenceThreshold: 0.4,
      maxTimelines: 16,
    });
    setRuntime(rt);
    setCurrentState(rt.getWorldState());
    setHistory([]);
    setConvergenceHistory([]);
    setTimelineHistory(new Map());
    toast.info('运行时已重置');
  };

  const getNodeColor = (nodeType: string) => {
    const colors: Record<string, string> = {
      'Revelation': 'bg-blue-500',
      'Choice': 'bg-yellow-500',
      'Crisis': 'bg-red-500',
      'Ascension': 'bg-green-500',
      'Collapse': 'bg-gray-500',
      'Encounter': 'bg-purple-500',
    };
    return colors[nodeType] || 'bg-gray-400';
  };

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>SEED-RT 运行时可视化</CardTitle>
            <Badge variant="outline">简化版</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleStart}
              disabled={isRunning || !runtime}
              variant="default"
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              启动
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isRunning}
              variant="outline"
              size="sm"
            >
              <Pause className="w-4 h-4 mr-2" />
              停止
            </Button>
            <Button
              onClick={handleStep}
              disabled={!runtime}
              variant="outline"
              size="sm"
            >
              <StepForward className="w-4 h-4 mr-2" />
              单步
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentState && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="timelines">时间线</TabsTrigger>
              <TabsTrigger value="convergence">收敛度</TabsTrigger>
              <TabsTrigger value="entities">实体</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">时间索引</div>
                  <div className="text-2xl font-bold">{currentState.timeIndex}</div>
                </div>
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">活跃时间线</div>
                  <div className="text-2xl font-bold">
                    {currentState.activeTimelines.filter(t => t.status === 'ACTIVE').length}
                  </div>
                </div>
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">实体数量</div>
                  <div className="text-2xl font-bold">{currentState.entities.length}</div>
                </div>
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">以太密度</div>
                  <div className="text-2xl font-bold">
                    {(currentState.globalParameters.aetherDensity * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">结构压力</div>
                  <div className="text-2xl font-bold">
                    {(currentState.globalParameters.structuralPressure * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="p-4 bg-secondary/30 rounded">
                  <div className="text-sm text-muted-foreground">熵水平</div>
                  <div className="text-2xl font-bold">
                    {(currentState.globalParameters.entropyLevel * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Timelines */}
            <TabsContent value="timelines" className="space-y-4">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {currentState.activeTimelines.map((timeline) => {
                  const node = currentState.fateGraph.nodes.find(n => n.id === timeline.currentNodeId);
                  return (
                    <Card key={timeline.id} className="p-4 bg-secondary/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{timeline.id}</div>
                        <Badge variant={timeline.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {timeline.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">当前节点: </span>
                          {node && (
                            <span className={`inline-block px-2 py-1 rounded text-white text-xs ${getNodeColor(node.type)}`}>
                              {node.type}
                            </span>
                          )}
                          <span className="ml-2">{timeline.currentNodeId}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">收敛度: </span>
                          <span className="font-semibold">{(timeline.convergenceScore * 100).toFixed(1)}%</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">路径: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {timeline.pathHistory.map((nodeId, idx) => {
                              const pathNode = currentState.fateGraph.nodes.find(n => n.id === nodeId);
                              return (
                                <span key={idx} className="text-xs">
                                  {pathNode ? (
                                    <span className={`px-1.5 py-0.5 rounded text-white ${getNodeColor(pathNode.type)}`}>
                                      {pathNode.type}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-gray-400 text-white">
                                      {nodeId}
                                    </span>
                                  )}
                                  {idx < timeline.pathHistory.length - 1 && <span className="mx-1">→</span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Convergence */}
            <TabsContent value="convergence" className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={convergenceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cycle" label={{ value: '循环', position: 'insideBottom', offset: -5 }} />
                    <YAxis domain={[0, 1]} label={{ value: '收敛度', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="convergence"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="全局收敛度"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {currentState.activeTimelines.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">各时间线收敛度:</div>
                  {currentState.activeTimelines.map(tl => (
                    <div key={tl.id} className="flex items-center gap-2">
                      <div className="w-32 text-xs truncate">{tl.id}</div>
                      <div className="flex-1 bg-secondary/30 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${tl.convergenceScore * 100}%` }}
                        />
                      </div>
                      <div className="w-16 text-xs text-right">
                        {(tl.convergenceScore * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Entities */}
            <TabsContent value="entities" className="space-y-2">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentState.entities.map((entity) => (
                  <Card key={entity.id} className="p-3 bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {entity.identityProfile?.name || entity.id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          类型: {entity.type} | 
                          BTOS: {entity.mindProfile?.btosLevel || 'N/A'} |
                          收敛度: {(entity.fateVector?.convergenceScore || 0) * 100}%
                        </div>
                        {entity.state && (
                          <div className="text-xs text-muted-foreground mt-1">
                            健康: {(entity.state.health * 100).toFixed(0)}% | 
                            能量: {(entity.state.energy * 100).toFixed(0)}% | 
                            稳定性: {(entity.state.structuralStability * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      {entity.identityProfile?.nodeClass && (
                        <Badge variant="outline">{entity.identityProfile.nodeClass}</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

