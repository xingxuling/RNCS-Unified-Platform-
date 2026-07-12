import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Layers, Zap, TrendingUp, Network } from 'lucide-react';
import { oseEngine } from '@/lib/ose';
import { OSEState } from '@/lib/ose';

export const OSEVisualizer = () => {
  const [state, setState] = useState<OSEState | null>(null);
  const [coreStates, setCoreStates] = useState<any>(null);

  useEffect(() => {
    const updateState = () => {
      try {
        // Get current OSE state
        const currentState = oseEngine.getState();
        if (currentState) {
          setState(currentState);
        }

        // Get core states
        const cores = oseEngine.getCoreResults();
        if (cores) {
          setCoreStates(cores);
        }
      } catch (error) {
        console.warn('Failed to update OSE state:', error);
      }
    };

    updateState();
    // Update periodically
    const interval = setInterval(updateState, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!state) {
    return (
      <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle>OSE 引擎状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">正在加载...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* WBG 三层状态 */}
      <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <CardTitle>WBG 三层架构</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* White Layer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white/80">White Layer (意识层)</span>
              <Badge variant="outline">意识</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>意识度</span>
                <span className="font-mono">{(state.white.consciousness * 100).toFixed(1)}%</span>
              </div>
              <Progress value={state.white.consciousness * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>潜意识</span>
                <span className="font-mono">{(state.white.subconscious * 100).toFixed(1)}%</span>
              </div>
              <Progress value={state.white.subconscious * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>意志</span>
                <span className="font-mono">{(state.white.will * 100).toFixed(1)}%</span>
              </div>
              <Progress value={state.white.will * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>和谐度</span>
                <span className="font-mono">{(state.white.harmony * 100).toFixed(1)}%</span>
              </div>
              <Progress value={state.white.harmony * 100} className="h-2" />
            </div>
            <div className="flex gap-2 mt-2">
              {state.white.origin && (
                <Badge variant="secondary" className="text-xs">起源</Badge>
              )}
              {state.white.seed && (
                <Badge variant="secondary" className="text-xs">种子</Badge>
              )}
            </div>
          </div>

          {/* Blue Layer */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-400">Blue Layer (结构层)</span>
              <Badge variant="outline" className="border-blue-400">结构</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">节点数</span>
                <div className="font-mono text-lg">{state.blue.nodes.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">边数</span>
                <div className="font-mono text-lg">{state.blue.edges.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">常量</span>
                <div className="font-mono text-lg">{state.blue.constants.size}</div>
              </div>
              <div>
                <span className="text-muted-foreground">网格</span>
                <div className="font-mono text-lg">{state.blue.grids.length}</div>
              </div>
            </div>
          </div>

          {/* Gold Layer */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-yellow-400">Gold Layer (执行层)</span>
              <Badge variant="outline" className="border-yellow-400">执行</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>权威</span>
                <span className="font-mono">{(state.gold.authority * 100).toFixed(1)}%</span>
              </div>
              <Progress value={state.gold.authority * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>支配</span>
                <span className="font-mono">{(state.gold.dominion * 100).toFixed(1)}%</span>
              </div>
              <Progress value={state.gold.dominion * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>力量</span>
                <span className="font-mono">{(state.gold.force * 100).toFixed(1)}%</span>
              </div>
              <Progress value={state.gold.force * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>提升</span>
                <span className="font-mono">{(state.gold.ascension * 100).toFixed(1)}%</span>
              </div>
              <Progress value={state.gold.ascension * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>命运收敛</span>
                <span className="font-mono text-primary">{(state.gold.convergence * 100).toFixed(1)}%</span>
              </div>
              <Progress value={state.gold.convergence * 100} className="h-2 bg-primary/20" />
            </div>
            {state.gold.fateNode && (
              <Badge variant="secondary" className="mt-2 text-xs">
                主线程节点: {state.gold.fateNode}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 九核系统状态 */}
      {coreStates && (
        <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <CardTitle>九核并行智能系统</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {Array.from(coreStates.entries()).map(([type, core]: [string, any]) => (
                <div
                  key={type}
                  className="p-3 bg-secondary/30 rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold capitalize">
                      {type.replace('_', ' ')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {(core.activation * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={core.activation * 100} className="h-1 mb-1" />
                  <div className="text-xs text-muted-foreground">
                    置信度: {(core.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 系统信息 */}
      <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            <CardTitle>系统信息</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">版本</span>
              <div className="font-mono">{state.version}</div>
            </div>
            <div>
              <span className="text-muted-foreground">时间戳</span>
              <div className="font-mono text-xs">
                {new Date(state.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

