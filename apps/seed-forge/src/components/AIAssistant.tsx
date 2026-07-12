import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Languages, Sparkles, MessageSquare, Code2, CheckCircle2, XCircle } from 'lucide-react';
import { AIAssistant } from '@/lib/ai/AIAssistant';
import { toast } from 'sonner';

export const AIAssistantComponent = () => {
  const [nlpInput, setNlpInput] = useState('');
  const [nlpResult, setNlpResult] = useState<any>(null);
  const [contentPrompt, setContentPrompt] = useState('');
  const [contentResult, setContentResult] = useState('');
  const [dialogueContext, setDialogueContext] = useState({
    agentName: '',
    agentPersonality: '',
    situation: '',
  });
  const [dialogueResult, setDialogueResult] = useState('');
  const [processing, setProcessing] = useState(false);

  const aiAssistant = new AIAssistant({ fallbackMode: 'rule-based' });

  const handleNLPToIAL = async () => {
    if (!nlpInput.trim()) {
      toast.error('请输入自然语言描述');
      return;
    }

    setProcessing(true);
    try {
      const result = await aiAssistant.naturalLanguageToIAL(nlpInput);
      setNlpResult(result);
      
      if (result.success) {
        toast.success('转换成功', {
          description: `置信度: ${(result.confidence * 100).toFixed(0)}%`,
        });
      } else {
        toast.warning('转换完成，但置信度较低', {
          description: '建议检查生成的 IAL 表达式',
        });
      }
    } catch (error) {
      toast.error('转换失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateContent = async (type: 'story' | 'description' | 'dialogue' | 'world') => {
    if (!contentPrompt.trim()) {
      toast.error('请输入生成提示');
      return;
    }

    setProcessing(true);
    try {
      const result = await aiAssistant.generateContent(contentPrompt, type);
      setContentResult(result);
      toast.success('内容生成成功');
    } catch (error) {
      toast.error('生成失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateDialogue = async () => {
    if (!dialogueContext.agentName || !dialogueContext.situation) {
      toast.error('请填写 Agent 名称和情境');
      return;
    }

    setProcessing(true);
    try {
      const result = await aiAssistant.generateDialogue({
        agentName: dialogueContext.agentName,
        agentPersonality: dialogueContext.agentPersonality || 'friendly',
        situation: dialogueContext.situation,
      });
      setDialogueResult(result);
      toast.success('对话生成成功');
    } catch (error) {
      toast.error('生成失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <CardTitle>AI 辅助层（规则驱动）</CardTitle>
          <Badge variant="outline" className="ml-auto">降级模式</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nlp" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nlp">
              <Languages className="w-4 h-4 mr-2" />
              自然语言转 IAL
            </TabsTrigger>
            <TabsTrigger value="content">
              <Sparkles className="w-4 h-4 mr-2" />
              内容生成
            </TabsTrigger>
            <TabsTrigger value="dialogue">
              <MessageSquare className="w-4 h-4 mr-2" />
              Agent 对话
            </TabsTrigger>
          </TabsList>

          {/* Natural Language to IAL */}
          <TabsContent value="nlp" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">自然语言描述</label>
              <Textarea
                value={nlpInput}
                onChange={(e) => setNlpInput(e.target.value)}
                placeholder="例如：创建一个意识系统"
                className="min-h-[100px]"
              />
            </div>
            <Button
              onClick={handleNLPToIAL}
              disabled={processing}
              className="w-full"
            >
              <Code2 className="w-4 h-4 mr-2" />
              {processing ? '转换中...' : '转换为 IAL'}
            </Button>

            {nlpResult && (
              <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10 space-y-2">
                <div className="flex items-center gap-2">
                  {nlpResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="font-semibold">
                    {nlpResult.success ? '转换成功' : '转换完成（低置信度）'}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {(nlpResult.confidence * 100).toFixed(0)}% 置信度
                  </Badge>
                </div>
                <div className="p-3 bg-background rounded font-mono text-sm">
                  {nlpResult.ial}
                </div>
                {nlpResult.alternatives && nlpResult.alternatives.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">备选方案：</span>
                    <div className="flex flex-wrap gap-2">
                      {nlpResult.alternatives.map((alt: string, i: number) => (
                        <Badge key={i} variant="secondary" className="font-mono text-xs">
                          {alt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Content Generation */}
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">生成提示</label>
              <Textarea
                value={contentPrompt}
                onChange={(e) => setContentPrompt(e.target.value)}
                placeholder="例如：描述一个充满魔法的世界"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleGenerateContent('story')}
                disabled={processing}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                生成故事
              </Button>
              <Button
                onClick={() => handleGenerateContent('description')}
                disabled={processing}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                生成描述
              </Button>
              <Button
                onClick={() => handleGenerateContent('world')}
                disabled={processing}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                生成世界
              </Button>
              <Button
                onClick={() => handleGenerateContent('dialogue')}
                disabled={processing}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                生成对话
              </Button>
            </div>

            {contentResult && (
              <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
                <div className="font-semibold mb-2">生成的内容：</div>
                <div className="text-sm whitespace-pre-wrap">{contentResult}</div>
              </div>
            )}
          </TabsContent>

          {/* Dialogue Generation */}
          <TabsContent value="dialogue" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Agent 名称</label>
                <Textarea
                  value={dialogueContext.agentName}
                  onChange={(e) => setDialogueContext({ ...dialogueContext, agentName: e.target.value })}
                  placeholder="例如：Alice"
                  className="min-h-[50px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Agent 性格</label>
                <Textarea
                  value={dialogueContext.agentPersonality}
                  onChange={(e) => setDialogueContext({ ...dialogueContext, agentPersonality: e.target.value })}
                  placeholder="例如：友好、严肃、幽默"
                  className="min-h-[50px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">情境</label>
                <Textarea
                  value={dialogueContext.situation}
                  onChange={(e) => setDialogueContext({ ...dialogueContext, situation: e.target.value })}
                  placeholder="例如：初次见面"
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <Button
              onClick={handleGenerateDialogue}
              disabled={processing}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {processing ? '生成中...' : '生成对话'}
            </Button>

            {dialogueResult && (
              <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
                <div className="font-semibold mb-2">生成的对话：</div>
                <div className="text-sm whitespace-pre-wrap">{dialogueResult}</div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

