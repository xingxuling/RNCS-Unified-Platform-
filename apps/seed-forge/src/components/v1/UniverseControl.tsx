import { useState, useEffect } from 'react';
import { universeManager } from '@/lib/v1/UniverseManager';
import { Universe } from '@/lib/v1/Universe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Plus, Trash2, GitBranch, Camera } from 'lucide-react';
import { toast } from 'sonner';

export const UniverseControl = () => {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [newUniverseName, setNewUniverseName] = useState('');
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null);

  useEffect(() => {
    refreshUniverses();
    const interval = setInterval(refreshUniverses, 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshUniverses = () => {
    setUniverses(universeManager.getUniverses());
  };

  const handleCreateUniverse = () => {
    if (!newUniverseName.trim()) {
      toast.error('请输入宇宙名称');
      return;
    }

    const universe = universeManager.createUniverse(newUniverseName, {
      tickInterval: 1000,
      timeScale: 1.0,
      physicsMode: 'newtonian',
      maxWorlds: 10,
      enableAutoSave: true,
    });

    toast.success(`宇宙已创建：${newUniverseName}`);
    setNewUniverseName('');
    refreshUniverses();
  };

  const handleStartUniverse = (universe: Universe) => {
    universe.start();
    toast.success('宇宙已启动');
    refreshUniverses();
  };

  const handlePauseUniverse = (universe: Universe) => {
    universe.pause();
    toast.info('宇宙已暂停');
    refreshUniverses();
  };

  const handleDeleteUniverse = (universeId: string) => {
    universeManager.deleteUniverse(universeId);
    toast.success('宇宙已删除');
    if (selectedUniverse === universeId) {
      setSelectedUniverse(null);
    }
    refreshUniverses();
  };

  const handleBranchUniverse = (universeId: string) => {
    const universe = universeManager.getUniverse(universeId);
    if (!universe) return;

    const name = universe.getData().name;
    universeManager.branchUniverse(universeId, 'Branch A', 'test deviation');
    toast.success(`宇宙 ${name} 已分支`);
    refreshUniverses();
  };

  const handleTakeSnapshot = (universeId: string) => {
    universeManager.takeSnapshot(universeId, `Snapshot ${Date.now()}`);
    toast.success('快照已创建');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'initializing': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  const stats = universeManager.getGlobalStats();

  return (
    <div className="space-y-6">
      {/* 全局统计 */}
      <Card className="border-primary/20 bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <span className="text-primary">🌌</span>
            Universe Manager v1.0
          </CardTitle>
          <CardDescription>多宇宙运行控制台</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.activeUniverses}</div>
              <div className="text-sm text-muted-foreground">运行中的宇宙</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-consciousness">{stats.activeWorlds}</div>
              <div className="text-sm text-muted-foreground">活跃世界</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">{stats.activeAgents}</div>
              <div className="text-sm text-muted-foreground">Agent 数量</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{universes.length}</div>
              <div className="text-sm text-muted-foreground">总宇宙数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 创建新宇宙 */}
      <Card>
        <CardHeader>
          <CardTitle>创建新宇宙</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="输入宇宙名称..."
              value={newUniverseName}
              onChange={(e) => setNewUniverseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateUniverse()}
            />
            <Button onClick={handleCreateUniverse}>
              <Plus className="w-4 h-4 mr-2" />
              创建
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 宇宙列表 */}
      <div className="grid gap-4">
        {universes.map((universe) => {
          const data = universe.getData();
          const stats = universe.getStats();

          return (
            <Card key={data.id} className="border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {data.name}
                      <Badge className={getStatusColor(data.status)}>
                        {data.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      ID: {data.id.slice(0, 8)}... | Tick: {data.currentTick} | 
                      Worlds: {stats.activeWorlds} | Agents: {stats.activeAgents}
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    {data.status === 'running' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePauseUniverse(universe)}
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartUniverse(universe)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTakeSnapshot(data.id)}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBranchUniverse(data.id)}
                    >
                      <GitBranch className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUniverse(data.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">物理模式:</span>{' '}
                    <span className="font-mono">{data.config.physicsMode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">时间尺度:</span>{' '}
                    <span className="font-mono">{data.config.timeScale}x</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tick 间隔:</span>{' '}
                    <span className="font-mono">{data.config.tickInterval}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {universes.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无宇宙。创建你的第一个宇宙来开始。
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
