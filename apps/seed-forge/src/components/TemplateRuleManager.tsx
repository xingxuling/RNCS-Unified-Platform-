import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Code, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  CheckCircle2,
  XCircle,
  Save
} from 'lucide-react';
import { TemplateManager, Template, TemplateType } from '@/lib/ai/TemplateManager';
import { RuleManager, NLPRule } from '@/lib/ai/RuleManager';
import { toast } from 'sonner';

export const TemplateRuleManager = () => {
  const [templateManager] = useState(() => new TemplateManager());
  const [ruleManager] = useState(() => new RuleManager());
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [rules, setRules] = useState<NLPRule[]>([]);
  const [selectedType, setSelectedType] = useState<TemplateType>('story');
  
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingRule, setEditingRule] = useState<NLPRule | null>(null);
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'story' as TemplateType,
    content: '',
    variables: [] as string[],
    description: '',
    tags: [] as string[],
  });
  
  const [newRule, setNewRule] = useState({
    name: '',
    pattern: '',
    ial: '',
    confidence: 0.7,
    alternatives: [] as string[],
    description: '',
    tags: [] as string[],
    priority: 5,
    enabled: true,
  });

  useEffect(() => {
    loadTemplates();
    loadRules();
  }, [selectedType]);

  const loadTemplates = () => {
    const allTemplates = templateManager.getTemplates(selectedType);
    setTemplates(allTemplates);
  };

  const loadRules = () => {
    const allRules = ruleManager.getAllRules();
    setRules(allRules);
  };

  const handleAddTemplate = () => {
    try {
      // Extract variables from content
      const variableMatches = newTemplate.content.match(/\{(\w+)\}/g);
      const variables = variableMatches 
        ? [...new Set(variableMatches.map(m => m.slice(1, -1)))]
        : [];

      templateManager.addTemplate({
        ...newTemplate,
        variables,
      });
      
      toast.success('模板已添加');
      setNewTemplate({
        name: '',
        type: 'story',
        content: '',
        variables: [],
        description: '',
        tags: [],
      });
      loadTemplates();
    } catch (error) {
      toast.error('添加模板失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleAddRule = () => {
    try {
      // Validate regex
      new RegExp(newRule.pattern);
      
      ruleManager.addRule(newRule);
      
      toast.success('规则已添加');
      setNewRule({
        name: '',
        pattern: '',
        ial: '',
        confidence: 0.7,
        alternatives: [],
        description: '',
        tags: [],
        priority: 5,
        enabled: true,
      });
      loadRules();
    } catch (error) {
      toast.error('添加规则失败', {
        description: error instanceof Error ? error.message : '无效的正则表达式',
      });
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (templateManager.deleteTemplate(id)) {
      toast.success('模板已删除');
      loadTemplates();
    } else {
      toast.error('无法删除默认模板');
    }
  };

  const handleDeleteRule = (id: string) => {
    if (ruleManager.deleteRule(id)) {
      toast.success('规则已删除');
      loadRules();
    } else {
      toast.error('无法删除默认规则');
    }
  };

  const handleExportTemplates = () => {
    const data = templateManager.exportTemplates();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templates-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('模板已导出');
  };

  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const result = templateManager.importTemplates(data);
        
        if (result.success) {
          toast.success(`成功导入 ${result.imported} 个模板`);
          if (result.errors.length > 0) {
            toast.warning(`部分导入失败: ${result.errors.join(', ')}`);
          }
          loadTemplates();
        } else {
          toast.error('导入失败', {
            description: result.errors.join(', '),
          });
        }
      } catch (error) {
        toast.error('导入失败', {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExportRules = () => {
    const data = ruleManager.exportRules();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rules-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('规则已导出');
  };

  const handleImportRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const result = ruleManager.importRules(data);
        
        if (result.success) {
          toast.success(`成功导入 ${result.imported} 个规则`);
          if (result.errors.length > 0) {
            toast.warning(`部分导入失败: ${result.errors.join(', ')}`);
          }
          loadRules();
        } else {
          toast.error('导入失败', {
            description: result.errors.join(', '),
          });
        }
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
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle>模板和规则管理</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              模板管理
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Code className="w-4 h-4 mr-2" />
              规则管理
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TemplateType)}
                className="px-3 py-2 bg-secondary border border-border rounded"
              >
                <option value="story">故事</option>
                <option value="description">描述</option>
                <option value="dialogue">对话</option>
                <option value="world">世界</option>
              </select>
              <Button onClick={handleExportTemplates} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
              <label className="px-3 py-2 bg-secondary border border-border rounded cursor-pointer hover:bg-accent">
                <Upload className="w-4 h-4 inline mr-2" />
                导入
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportTemplates}
                  className="hidden"
                />
              </label>
            </div>

            {/* Add Template Form */}
            <Card className="p-4 bg-secondary/30">
              <div className="space-y-3">
                <Input
                  placeholder="模板名称"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
                <Textarea
                  placeholder="模板内容（使用 {variable} 作为变量）"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className="min-h-[100px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="描述（可选）"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTemplate} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    添加
                  </Button>
                </div>
              </div>
            </Card>

            {/* Templates List */}
            <div className="space-y-2">
              {templates.map((template) => (
                <Card key={template.id} className="p-3 bg-secondary/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{template.name}</span>
                        <Badge variant="outline">{template.type}</Badge>
                        {template.id.startsWith('custom-') && (
                          <Badge variant="secondary">自定义</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono mb-2">
                        {template.content}
                      </div>
                      {template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((v) => (
                            <Badge key={v} variant="outline" className="text-xs">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {template.id.startsWith('custom-') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleExportRules} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
              <label className="px-3 py-2 bg-secondary border border-border rounded cursor-pointer hover:bg-accent">
                <Upload className="w-4 h-4 inline mr-2" />
                导入
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportRules}
                  className="hidden"
                />
              </label>
            </div>

            {/* Add Rule Form */}
            <Card className="p-4 bg-secondary/30">
              <div className="space-y-3">
                <Input
                  placeholder="规则名称"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
                <Input
                  placeholder="正则表达式模式"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="IAL 表达式"
                  value={newRule.ial}
                  onChange={(e) => setNewRule({ ...newRule, ial: e.target.value })}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="置信度 (0-1)"
                    value={newRule.confidence}
                    onChange={(e) => setNewRule({ ...newRule, confidence: parseFloat(e.target.value) })}
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-32"
                  />
                  <Input
                    type="number"
                    placeholder="优先级"
                    value={newRule.priority}
                    onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                    className="w-32"
                  />
                  <Button onClick={handleAddRule} size="sm" className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    添加
                  </Button>
                </div>
              </div>
            </Card>

            {/* Rules List */}
            <div className="space-y-2">
              {rules.map((rule) => (
                <Card key={rule.id} className="p-3 bg-secondary/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{rule.name}</span>
                        {rule.enabled ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-500" />
                        )}
                        {rule.id.startsWith('custom-rule-') && (
                          <Badge variant="secondary">自定义</Badge>
                        )}
                        <Badge variant="outline">优先级: {rule.priority}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono mb-1">
                        模式: {rule.pattern}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono mb-2">
                        IAL: {rule.ial}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          置信度: {(rule.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {rule.id.startsWith('custom-rule-') && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => ruleManager.toggleRule(rule.id) && loadRules()}
                        >
                          {rule.enabled ? '禁用' : '启用'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

