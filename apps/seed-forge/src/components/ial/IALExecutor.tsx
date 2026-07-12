import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Copy, Check } from 'lucide-react';
import { compileAndExecuteIAL, IALExecutionResult, applyIALToRuntime } from '@/ial';
import { WorldState } from '@/seed-runtime/seedRuntime';
import { SEEDRuntime } from '@/seed-runtime/seedRuntime';
import { UniverseForgeAdapter } from '@/seed-runtime/UniverseForgeAdapter';
import { toast } from 'sonner';

export const IALExecutor = () => {
  const [ialExpression, setIALExpression] = useState('Ψ : Γ K Z : V');
  const [result, setResult] = useState<IALExecutionResult | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [runtime, setRuntime] = useState<SEEDRuntime | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Initialize runtime
  useEffect(() => {
    const initialState = UniverseForgeAdapter.createInitialWorldState('universe-ial', '杜浩麟');
    const rt = new SEEDRuntime(initialState, {
      mainlineOriginName: '杜浩麟',
    });
    setRuntime(rt);
    setWorldState(rt.getWorldState());
  }, []);

  const handleExecute = () => {
    if (!runtime) return;

    try {
      // 使用新的桥接方法直接应用到运行时
      const bridgeResult = applyIALToRuntime(runtime, ialExpression, {
        mainEntityId: 'entity-mainline',
        intensity: 0.08,
      });

      setResult(bridgeResult.execution);
      setWorldState(bridgeResult.worldState);
      setEvents(bridgeResult.events);

      toast.success('IAL 执行成功', {
        description: `生成了 ${bridgeResult.events.length} 个事件`,
      });
    } catch (error) {
      toast.error('执行失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('已复制到剪贴板');
  };

  const getLayerColor = (layer: string) => {
    switch (layer) {
      case 'WHITE': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'BLUE': return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'GOLD': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle>IAL 执行器</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">IAL 表达式</label>
          <div className="flex gap-2">
            <Textarea
              value={ialExpression}
              onChange={(e) => setIALExpression(e.target.value)}
              placeholder="输入 IAL 表达式，例如: Ψ : Γ K Z : V"
              className="font-mono"
              rows={3}
            />
            <Button onClick={handleExecute} className="shrink-0">
              <Play className="w-4 h-4 mr-2" />
              执行
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            格式: White层 : Blue层 : Gold层
          </div>
        </div>

        {result && (
          <Tabs defaultValue="program" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="program">程序结构</TabsTrigger>
              <TabsTrigger value="context">执行上下文</TabsTrigger>
              <TabsTrigger value="worldstate">世界状态</TabsTrigger>
            </TabsList>

            {/* Program Structure */}
            <TabsContent value="program" className="space-y-4">
              <div className="space-y-4">
                {result.program.whiteOps.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">White 层操作</h3>
                      <Badge className={getLayerColor('WHITE')}>WHITE</Badge>
                    </div>
                    <div className="space-y-2">
                      {result.program.whiteOps.map((op, idx) => (
                        <Card key={idx} className="p-3 bg-secondary/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-lg">{op.glyph}</div>
                              <div className="text-sm text-muted-foreground">{op.description}</div>
                            </div>
                            <Badge variant="outline">{op.opcode}</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {result.program.blueOps.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">Blue 层操作</h3>
                      <Badge className={getLayerColor('BLUE')}>BLUE</Badge>
                    </div>
                    <div className="space-y-2">
                      {result.program.blueOps.map((op, idx) => (
                        <Card key={idx} className="p-3 bg-secondary/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-lg">{op.glyph}</div>
                              <div className="text-sm text-muted-foreground">{op.description}</div>
                            </div>
                            <Badge variant="outline">{op.opcode}</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {result.program.goldOps.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">Gold 层操作</h3>
                      <Badge className={getLayerColor('GOLD')}>GOLD</Badge>
                    </div>
                    <div className="space-y-2">
                      {result.program.goldOps.map((op, idx) => (
                        <Card key={idx} className="p-3 bg-secondary/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-lg">{op.glyph}</div>
                              <div className="text-sm text-muted-foreground">{op.description}</div>
                            </div>
                            <Badge variant="outline">{op.opcode}</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Execution Context */}
            <TabsContent value="context" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">意识模式标签 (White Layer)</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.context.whiteModeTags.length > 0 ? (
                      result.context.whiteModeTags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className={getLayerColor('WHITE')}>
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">无</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">结构指令 (Blue Layer)</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.context.structures.length > 0 ? (
                      result.context.structures.map((struct, idx) => (
                        <Badge key={idx} variant="outline" className={getLayerColor('BLUE')}>
                          {struct}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">无</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">执行动作 (Gold Layer)</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.context.actions.length > 0 ? (
                      result.context.actions.map((action, idx) => (
                        <Badge key={idx} variant="outline" className={getLayerColor('GOLD')}>
                          {action}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">无</span>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* World State */}
            <TabsContent value="worldstate" className="space-y-4">
              {worldState && (
                <div className="space-y-4">
                  {events.length > 0 && (
                    <div className="p-4 bg-primary/10 rounded border border-primary/20">
                      <div className="text-sm font-semibold mb-2">生成的事件 ({events.length})</div>
                      <div className="space-y-2">
                        {events.map((evt: any, idx: number) => (
                          <div key={idx} className="text-xs p-2 bg-secondary/30 rounded">
                            <div className="font-semibold">{evt.name}</div>
                            <div className="text-muted-foreground">{evt.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-secondary/30 rounded">
                      <div className="text-sm text-muted-foreground">以太密度</div>
                      <div className="text-2xl font-bold">
                        {(worldState.globalParameters.aetherDensity * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded">
                      <div className="text-sm text-muted-foreground">结构压力</div>
                      <div className="text-2xl font-bold">
                        {(worldState.globalParameters.structuralPressure * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded">
                      <div className="text-sm text-muted-foreground">熵水平</div>
                      <div className="text-2xl font-bold">
                        {(worldState.globalParameters.entropyLevel * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">命运节点</h3>
                      <Badge variant="outline">{worldState.fateGraph.nodes.length}</Badge>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {worldState.fateGraph.nodes.map((node) => (
                        <Card key={node.id} className="p-2 bg-secondary/30">
                          <div className="text-xs">
                            <span className="font-mono">{node.id}</span>
                            <span className="ml-2 text-muted-foreground">{node.type}</span>
                            {node.description && (
                              <span className="ml-2 text-muted-foreground">- {node.description}</span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">实体</h3>
                      <Badge variant="outline">{worldState.entities.length}</Badge>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {worldState.entities.map((entity) => (
                        <Card key={entity.id} className="p-2 bg-secondary/30">
                          <div className="text-xs">
                            <span className="font-semibold">{entity.identityProfile?.name || entity.id}</span>
                            {entity.fateVector && (
                              <span className="ml-2 text-muted-foreground">
                                收敛度: {(entity.fateVector.convergenceScore * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(JSON.stringify(worldState, null, 2))}
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        复制世界状态 JSON
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

