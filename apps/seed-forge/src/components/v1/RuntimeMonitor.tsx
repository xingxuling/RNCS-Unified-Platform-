import { useState, useEffect } from 'react';
import { universeManager } from '@/lib/v1/UniverseManager';
import { Universe } from '@/lib/v1/Universe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { performanceMonitor } from '@/lib/performance/PerformanceMonitor';

export const RuntimeMonitor = () => {
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [systemLog, setSystemLog] = useState<string[]>([]);
  const [aetherLog, setAetherLog] = useState<string[]>([]);
  const [soulLog, setSoulLog] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const universes = universeManager.getUniverses();
      if (universes.length > 0 && !selectedUniverse) {
        setSelectedUniverse(universes[0]);
      }

      setSystemLog(universeManager.getLog().slice(-50));

      if (selectedUniverse) {
        const state = selectedUniverse.exportState();
        setAetherLog(state.aetherLog.slice(-30));
        setSoulLog(state.soulLog.slice(-30));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [selectedUniverse]);

  const universes = universeManager.getUniverses();

  if (universes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          暂无运行的宇宙。创建并启动一个宇宙以查看运行监控。
        </CardContent>
      </Card>
    );
  }

  const universeData = selectedUniverse?.getData();
  const worlds = selectedUniverse?.getWorlds() || [];
  const agents = selectedUniverse?.getAgents() || [];

  return (
    <div className="space-y-6">
      {/* 宇宙选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择宇宙</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {universes.map((universe) => {
              const data = universe.getData();
              return (
                <Badge
                  key={data.id}
                  variant={selectedUniverse === universe ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedUniverse(universe)}
                >
                  {data.name}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 运行时状态 */}
      {universeData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">宇宙状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态:</span>
                  <Badge>{universeData.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tick:</span>
                  <span className="font-mono">{universeData.currentTick}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">时间尺度:</span>
                  <span className="font-mono">{universeData.config.timeScale}x</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">世界统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总数:</span>
                  <span className="font-mono">{worlds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">活跃:</span>
                  <span className="font-mono">
                    {worlds.filter(w => w.state.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">平均熵:</span>
                  <span className="font-mono">
                    {worlds.length > 0
                      ? (worlds.reduce((sum, w) => sum + w.state.entropy, 0) / worlds.length).toFixed(1)
                      : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Agent 统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总数:</span>
                  <span className="font-mono">{agents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NPC:</span>
                  <span className="font-mono">{agents.filter(a => a.kind === 'npc').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">玩家:</span>
                  <span className="font-mono">{agents.filter(a => a.kind === 'player').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 性能监控和日志 */}
      <Tabs defaultValue="performance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">性能监控</TabsTrigger>
              <TabsTrigger value="system">系统日志</TabsTrigger>
              <TabsTrigger value="aether">以太引擎</TabsTrigger>
              <TabsTrigger value="soul">心智引擎</TabsTrigger>
            </TabsList>

        <TabsContent value="performance" className="mt-4">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>系统日志</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-1 font-mono text-xs">
                  {systemLog.length === 0 ? (
                    <div className="text-muted-foreground">暂无系统日志</div>
                  ) : (
                    systemLog.map((log, i) => (
                      <div key={i} className="text-foreground/80">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
            </TabsContent>

        <TabsContent value="aether" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>以太引擎日志</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-1 font-mono text-xs">
                  {aetherLog.length === 0 ? (
                    <div className="text-muted-foreground">暂无以太引擎日志</div>
                  ) : (
                    aetherLog.map((log, i) => (
                      <div key={i} className="text-primary/80">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
            </TabsContent>

        <TabsContent value="soul" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>心智引擎日志</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-1 font-mono text-xs">
                  {soulLog.length === 0 ? (
                    <div className="text-muted-foreground">暂无心智引擎日志</div>
                  ) : (
                    soulLog.map((log, i) => (
                      <div key={i} className="text-consciousness/80">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
            </TabsContent>
          </Tabs>

    </div>
  );
};
