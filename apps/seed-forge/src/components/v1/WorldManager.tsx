import { useState, useEffect } from 'react';
import { universeManager } from '@/lib/v1/UniverseManager';
import { Universe } from '@/lib/v1/Universe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Globe, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { World } from '@/lib/v1/types';

export const WorldManager = () => {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [newWorldName, setNewWorldName] = useState('');
  const [worldLayer, setWorldLayer] = useState<World['layer']>('base');

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 1000);
    return () => clearInterval(interval);
  }, [selectedUniverse]);

  const refreshData = () => {
    const allUniverses = universeManager.getUniverses();
    setUniverses(allUniverses);

    if (selectedUniverse) {
      const updated = universeManager.getUniverse(selectedUniverse.getData().id);
      if (updated) {
        setWorlds(updated.getWorlds());
      }
    } else if (allUniverses.length > 0) {
      setSelectedUniverse(allUniverses[0]);
    }
  };

  const handleCreateWorld = () => {
    if (!selectedUniverse) {
      toast.error('请先选择一个宇宙');
      return;
    }

    if (!newWorldName.trim()) {
      toast.error('请输入世界名称');
      return;
    }

    selectedUniverse.createWorld(newWorldName, worldLayer);
    toast.success(`世界已创建：${newWorldName}`);
    setNewWorldName('');
    refreshData();
  };

  const handleSpawnAgent = (worldId: string) => {
    if (!selectedUniverse) return;

    const agentName = `Agent-${Math.floor(Math.random() * 1000)}`;
    selectedUniverse.spawnAgent(worldId, agentName, 'npc');
    toast.success(`Agent 已生成：${agentName}`);
    refreshData();
  };

  const getLayerColor = (layer: World['layer']) => {
    switch (layer) {
      case 'base': return 'bg-primary';
      case 'subspace': return 'bg-consciousness';
      case 'dream': return 'bg-accent';
      case 'instance': return 'bg-secondary';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'initializing': return 'bg-blue-500';
      case 'collapsed': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* 宇宙选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择宇宙</CardTitle>
          <CardDescription>在选中的宇宙中创建和管理世界</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {universes.map((universe) => {
              const data = universe.getData();
              return (
                <Badge
                  key={data.id}
                  variant={selectedUniverse?.getData().id === data.id ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => setSelectedUniverse(universe)}
                >
                  {data.name}
                </Badge>
              );
            })}
            {universes.length === 0 && (
              <p className="text-muted-foreground text-sm">
                暂无宇宙。请先在 Universe 标签页创建一个宇宙。
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUniverse && (
        <>
          {/* 创建新世界 */}
          <Card>
            <CardHeader>
              <CardTitle>创建新世界</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="世界名称..."
                  value={newWorldName}
                  onChange={(e) => setNewWorldName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWorld()}
                  className="flex-1"
                />
                <Select value={worldLayer} onValueChange={(v) => setWorldLayer(v as World['layer'])}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base Layer</SelectItem>
                    <SelectItem value="subspace">Subspace</SelectItem>
                    <SelectItem value="dream">Dream Layer</SelectItem>
                    <SelectItem value="instance">Instance</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateWorld}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 世界列表 */}
          <div className="grid gap-4 md:grid-cols-2">
            {worlds.map((world) => {
              const agents = selectedUniverse.getAgents(world.id);

              return (
                <Card key={world.id} className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Globe className="w-5 h-5 text-primary" />
                          {world.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge className={getLayerColor(world.layer)}>
                              {world.layer}
                            </Badge>
                            <Badge className={getStatusColor(world.state.status)}>
                              {world.state.status}
                            </Badge>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* 世界统计 */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground">Tick</div>
                        <div className="font-mono font-bold">{world.time.tick}</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground">熵值</div>
                        <div className="font-mono font-bold">{world.state.entropy.toFixed(1)}</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground">因果权重</div>
                        <div className="font-mono font-bold">{world.state.causalWeight.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Agents */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Agents ({agents.length})
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSpawnAgent(world.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          生成
                        </Button>
                      </div>

                      {agents.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {agents.slice(0, 5).map(agent => (
                            <Badge key={agent.id} variant="secondary" className="text-xs">
                              {agent.name}
                            </Badge>
                          ))}
                          {agents.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{agents.length - 5} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">暂无 Agent</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {worlds.length === 0 && (
              <Card className="border-dashed col-span-2">
                <CardContent className="py-12 text-center text-muted-foreground">
                  该宇宙中暂无世界。创建第一个世界来开始。
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};
