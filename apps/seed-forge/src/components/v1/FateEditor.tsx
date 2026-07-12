import { useState, useEffect } from 'react';
import { universeManager } from '@/lib/v1/UniverseManager';
import { Universe } from '@/lib/v1/Universe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Play, RotateCcw, Zap, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import type { FateNode, AetherionCondition, FateEffect } from '@/lib/v1/types';

export const FateEditor = () => {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [nodes, setNodes] = useState<FateNode[]>([]);
  const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);

  // 新节点表单
  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeImportance, setNodeImportance] = useState('50');

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
        const weaver = updated.getFateWeaver();
        const graph = weaver.exportGraph(updated.getData().id);
        if (graph) {
          setNodes(graph.nodes);
          setActiveNodeIds(graph.activeNodeIds);
        }
      }
    } else if (allUniverses.length > 0) {
      setSelectedUniverse(allUniverses[0]);
    }
  };

  const handleCreateNode = () => {
    if (!selectedUniverse) {
      toast.error('请先选择一个宇宙');
      return;
    }

    if (!nodeName.trim()) {
      toast.error('请输入节点名称');
      return;
    }

    const weaver = selectedUniverse.getFateWeaver();
    weaver.createNode(
      selectedUniverse.getData().id,
      nodeName,
      nodeDescription,
      parseInt(nodeImportance) || 50
    );

    toast.success(`命运节点已创建：${nodeName}`);
    setNodeName('');
    setNodeDescription('');
    setNodeImportance('50');
    refreshData();
  };

  const handleActivateNode = (nodeId: string) => {
    if (!selectedUniverse) return;

    const weaver = selectedUniverse.getFateWeaver();
    weaver.activateNode(selectedUniverse.getData().id, nodeId);
    toast.success('节点已激活');
    refreshData();
  };

  const handleDeactivateNode = (nodeId: string) => {
    if (!selectedUniverse) return;

    const weaver = selectedUniverse.getFateWeaver();
    weaver.deactivateNode(selectedUniverse.getData().id, nodeId);
    toast.info('节点已停用');
    refreshData();
  };

  const handleResetNode = (nodeId: string) => {
    if (!selectedUniverse) return;

    const weaver = selectedUniverse.getFateWeaver();
    weaver.resetNode(selectedUniverse.getData().id, nodeId);
    toast.info('节点已重置');
    refreshData();
  };

  const handleAddEffect = (nodeId: string, type: FateEffect['type']) => {
    if (!selectedUniverse) return;

    const weaver = selectedUniverse.getFateWeaver();
    const node = weaver.getNode(selectedUniverse.getData().id, nodeId);
    if (!node) return;

    const effect: FateEffect = {
      type,
      target: 'default',
      params: {},
    };

    node.effects.push(effect);
    toast.success(`效果已添加：${type}`);
    refreshData();
  };

  const handleAddCondition = (nodeId: string) => {
    if (!selectedUniverse) return;

    const weaver = selectedUniverse.getFateWeaver();
    const node = weaver.getNode(selectedUniverse.getData().id, nodeId);
    if (!node) return;

    const condition: AetherionCondition = {
      field: 'agent.count',
      operator: 'gt',
      value: 0,
    };

    node.conditions.push(condition);
    toast.success('条件已添加');
    refreshData();
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 80) return 'text-red-500';
    if (importance >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* 宇宙选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Fate Weaver v1.0
          </CardTitle>
          <CardDescription>命运编织器 - 创建和管理命运节点</CardDescription>
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
                暂无宇宙。请先创建一个宇宙。
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUniverse && (
        <>
          {/* 创建节点 */}
          <Card>
            <CardHeader>
              <CardTitle>创建命运节点</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="节点名称 (例如：英雄诞生)"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
              />
              <Textarea
                placeholder="节点描述 (例如：当世界熵值达到50时，一位英雄将降生)"
                value={nodeDescription}
                onChange={(e) => setNodeDescription(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">
                    重要性 (0-100)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={nodeImportance}
                    onChange={(e) => setNodeImportance(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCreateNode}>
                    <Plus className="w-4 h-4 mr-2" />
                    创建节点
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 节点列表 */}
          <div className="grid gap-4">
            {nodes.map((node) => {
              const isActive = activeNodeIds.includes(node.id);

              return (
                <Card key={node.id} className={`${isActive ? 'border-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {node.label}
                          {node.executed && <Badge variant="secondary">已执行</Badge>}
                          {isActive && <Badge className="bg-primary">活跃中</Badge>}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {node.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateNode(node.id)}
                          >
                            停用
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleActivateNode(node.id)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            激活
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetNode(node.id)}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Tabs defaultValue="info">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="info">信息</TabsTrigger>
                        <TabsTrigger value="conditions">条件</TabsTrigger>
                        <TabsTrigger value="effects">效果</TabsTrigger>
                      </TabsList>

                      <TabsContent value="info" className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">重要性:</span>{' '}
                            <span className={`font-bold ${getImportanceColor(node.importance)}`}>
                              {node.importance}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">执行次数:</span>{' '}
                            <span className="font-mono">{node.executionCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">权重:</span>{' '}
                            <span className="font-mono">{node.weight.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">下一节点:</span>{' '}
                            <span className="font-mono">{node.nextNodeIds.length}</span>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="conditions" className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            条件 ({node.conditions.length})
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddCondition(node.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            添加
                          </Button>
                        </div>
                        {node.conditions.length > 0 ? (
                          <div className="space-y-1">
                            {node.conditions.map((cond, i) => (
                              <div key={i} className="text-xs font-mono bg-muted p-2 rounded">
                                {cond.field} {cond.operator} {cond.value}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">无条件（总是触发）</p>
                        )}
                      </TabsContent>

                      <TabsContent value="effects" className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            效果 ({node.effects.length})
                          </span>
                          <Select onValueChange={(v) => handleAddEffect(node.id, v as FateEffect['type'])}>
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue placeholder="添加效果" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modify_state">修改状态</SelectItem>
                              <SelectItem value="spawn_entity">生成实体</SelectItem>
                              <SelectItem value="trigger_event">触发事件</SelectItem>
                              <SelectItem value="branch_universe">分支宇宙</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {node.effects.length > 0 ? (
                          <div className="space-y-1">
                            {node.effects.map((effect, i) => (
                              <div key={i} className="text-xs bg-muted p-2 rounded">
                                <Badge variant="secondary" className="mb-1">
                                  {effect.type}
                                </Badge>
                                <div className="font-mono text-muted-foreground">
                                  target: {effect.target}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">暂无效果</p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              );
            })}

            {nodes.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  暂无命运节点。创建第一个节点来开始编织命运。
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};
