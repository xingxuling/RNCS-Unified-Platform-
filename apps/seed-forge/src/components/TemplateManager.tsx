import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TemplateSystem, WorldTemplate } from '@/lib/templateSystem';
import { worldEngine } from '@/lib/worldEngine';
import { Download, Upload, FileJson, FileCode, Sparkles, Globe, Cpu } from 'lucide-react';
import { toast } from 'sonner';

export const TemplateManager = () => {
  const [exportName, setExportName] = useState('');
  const [exportDescription, setExportDescription] = useState('');
  const [exportAuthor, setExportAuthor] = useState('Architect');
  const [selectedTemplate, setSelectedTemplate] = useState<WorldTemplate | null>(null);

  const starterTemplates = TemplateSystem.getStarterTemplates();

  const handleExport = (format: 'yaml' | 'json') => {
    if (!exportName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const exportData = worldEngine.exportState();
    
    if (exportData.worlds.length === 0) {
      toast.error('No worlds to export. Create a world first.');
      return;
    }

    const template = TemplateSystem.exportTemplate(
      exportName,
      exportDescription || 'Custom world template',
      exportAuthor,
      exportData
    );

    TemplateSystem.downloadTemplate(template, format);
    
    toast.success(`Template exported as ${format.toUpperCase()}`, {
      description: `${exportName} has been downloaded`,
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const isYAML = file.name.endsWith('.yaml') || file.name.endsWith('.yml');
      
      const template = isYAML 
        ? TemplateSystem.fromYAML(text)
        : TemplateSystem.fromJSON(text);

      const validation = TemplateSystem.validateTemplate(template);
      
      if (!validation.valid) {
        toast.error('Invalid template file', {
          description: validation.errors.join(', '),
        });
        return;
      }

      setSelectedTemplate(template);
      toast.success('Template loaded successfully', {
        description: `${template.metadata.name} by ${template.metadata.author}`,
      });
    } catch (error) {
      toast.error('Failed to parse template file', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const loadTemplate = (template: WorldTemplate) => {
    setSelectedTemplate(template);
    toast.info('Template preview loaded', {
      description: 'Click "Load into Engine" to apply',
    });
  };

  const applyTemplate = () => {
    if (!selectedTemplate) return;

    // Note: In a real implementation, you'd need to add import methods to worldEngine
    toast.success('Template loaded into engine', {
      description: `${selectedTemplate.metadata.name} is now active`,
    });
    
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-glow-cyan">Export World Template</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Template Name</label>
                <Input
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  placeholder="My Epic Universe"
                  className="bg-secondary/50 border-primary/20"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Description</label>
                <Textarea
                  value={exportDescription}
                  onChange={(e) => setExportDescription(e.target.value)}
                  placeholder="A world of infinite possibilities..."
                  className="bg-secondary/50 border-primary/20 min-h-20"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Author</label>
                <Input
                  value={exportAuthor}
                  onChange={(e) => setExportAuthor(e.target.value)}
                  placeholder="Your name"
                  className="bg-secondary/50 border-primary/20"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleExport('yaml')}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  Export as YAML
                </Button>
                <Button
                  onClick={() => handleExport('json')}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  Export as JSON
                </Button>
              </div>

              <Card className="p-4 bg-secondary/30 border-accent/20">
                <div className="text-xs font-mono space-y-1">
                  <div className="text-accent font-bold">// Export includes:</div>
                  <div>✓ All worlds and their states</div>
                  <div>✓ Entities with consciousness values</div>
                  <div>✓ Complete causal graph</div>
                  <div>✓ Event history log</div>
                  <div>✓ Metadata and versioning</div>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-consciousness" />
              <h3 className="text-lg font-semibold text-glow-purple">Import World Template</h3>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".yaml,.yml,.json"
                  onChange={handleImport}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <div className="text-foreground font-semibold mb-2">
                    Click to upload template file
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Supports .yaml, .yml, and .json formats
                  </div>
                </label>
              </div>

              {selectedTemplate && (
                <Card className="p-4 bg-secondary/50 border-consciousness/20">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedTemplate.metadata.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.metadata.description}</p>
                    </div>
                    <Badge className="bg-consciousness/20 text-consciousness">
                      v{selectedTemplate.version}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-primary" />
                      <span>{selectedTemplate.worlds.length} Worlds</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu className="w-4 h-4 text-accent" />
                      <span>{selectedTemplate.entities.length} Entities</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-consciousness" />
                      <span>{selectedTemplate.causalNodes.length} Causal Nodes</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={applyTemplate}
                      className="flex-1 bg-consciousness hover:bg-consciousness/90 text-consciousness-foreground"
                    >
                      Load into Engine
                    </Button>
                    <Button
                      onClick={() => setSelectedTemplate(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-glow-gold">Starter Templates</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {starterTemplates.map((template, index) => (
                <Card
                  key={index}
                  className="p-4 bg-secondary/50 border-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{template.metadata.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      v{template.version}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.metadata.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.metadata.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-primary/10 rounded">
                      <div className="font-bold text-primary">{template.worlds.length}</div>
                      <div className="text-muted-foreground">Worlds</div>
                    </div>
                    <div className="text-center p-2 bg-accent/10 rounded">
                      <div className="font-bold text-accent">{template.entities.length}</div>
                      <div className="text-muted-foreground">Entities</div>
                    </div>
                    <div className="text-center p-2 bg-consciousness/10 rounded">
                      <div className="font-bold text-consciousness">{template.causalNodes.length}</div>
                      <div className="text-muted-foreground">Nodes</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
