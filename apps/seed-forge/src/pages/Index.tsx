import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorldDashboard } from '@/components/WorldDashboard';
import { CausalExecutor } from '@/components/CausalExecutor';
import { FateGraph } from '@/components/FateGraph';
import { FateGraph3D } from '@/components/FateGraph3D';
import { SystemConsole } from '@/components/SystemConsole';
import { WorldCreator } from '@/components/WorldCreator';
import { ApiDocs } from '@/components/ApiDocs';
import { TemplateManager } from '@/components/TemplateManager';
import { UniverseControl } from '@/components/v1/UniverseControl';
import { RuntimeMonitor } from '@/components/v1/RuntimeMonitor';
import { WorldManager } from '@/components/v1/WorldManager';
import { FateEditor } from '@/components/v1/FateEditor';
import { PersistenceManager } from '@/components/PersistenceManager';
import { IALCompiler } from '@/components/IALCompiler';
import { OSEVisualizer } from '@/components/OSEVisualizer';
import { FateConvergenceChart } from '@/components/FateConvergenceChart';
import { NineCoreHeatmap } from '@/components/NineCoreHeatmap';
import { IALASTViewer } from '@/components/IALASTViewer';
import { AIAssistantComponent } from '@/components/AIAssistant';
import { TemplateRuleManager } from '@/components/TemplateRuleManager';
import { SEEDRuntimeSimulator } from '@/components/SEEDRuntimeSimulator';
import { SEEDRuntimeVisualizer } from '@/components/seed-runtime/SEEDRuntimeVisualizer';
import { IALExecutor } from '@/components/ial/IALExecutor';
import { SeedControlCenter } from '@/components/SeedControlCenter';
import { Cpu, Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background cosmic-grid">
      {/* Animated scan line effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0 h-20 animate-scan" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-primary/10 rounded-lg border-2 border-primary glow-cyan">
              <Cpu className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-glow-cyan flex items-center gap-2">
                THE SEED v1.0
                <Sparkles className="w-6 h-6 text-accent animate-pulse" />
              </h1>
              <p className="text-muted-foreground">Multi-Universe OS • Reality Kernel • Causal Runtime</p>
            </div>
          </div>
          
          <div className="flex gap-2 text-xs font-mono">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded border border-primary/30">
              REALITY KERNEL ACTIVE
            </span>
            <span className="px-2 py-1 bg-accent/10 text-accent rounded border border-accent/30">
              FATE WEAVING ONLINE
            </span>
            <span className="px-2 py-1 bg-consciousness/10 text-consciousness rounded border border-consciousness/30">
              SOUL ENGINE READY
            </span>
          </div>
        </header>

        {/* Main Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-15 bg-card/50 backdrop-blur border border-primary/20 text-xs">
            <TabsTrigger value="universe">🌌 Universe</TabsTrigger>
            <TabsTrigger value="worlds">🌍 Worlds</TabsTrigger>
            <TabsTrigger value="fate">⚡ Fate</TabsTrigger>
            <TabsTrigger value="monitor">📊 Monitor</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="creator">Creator</TabsTrigger>
            <TabsTrigger value="executor">Executor</TabsTrigger>
            <TabsTrigger value="3d">3D View</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
            <TabsTrigger value="persistence">💾 Storage</TabsTrigger>
            <TabsTrigger value="ial">🔤 IAL</TabsTrigger>
            <TabsTrigger value="ai">🤖 AI</TabsTrigger>
            <TabsTrigger value="runtime">⚙️ Runtime</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          <TabsContent value="universe" className="mt-6">
            <UniverseControl />
          </TabsContent>

          <TabsContent value="worlds" className="mt-6">
            <WorldManager />
          </TabsContent>

          <TabsContent value="fate" className="mt-6">
            <FateEditor />
          </TabsContent>

          <TabsContent value="monitor" className="mt-6">
            <RuntimeMonitor />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <WorldDashboard />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FateGraph />
              <SystemConsole />
            </div>
          </TabsContent>

          <TabsContent value="creator" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <WorldCreator />
              </div>
              <div className="lg:col-span-2">
                <WorldDashboard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="executor" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CausalExecutor />
              <FateGraph />
            </div>
          </TabsContent>

          <TabsContent value="3d" className="mt-6">
            <FateGraph3D />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="console" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SystemConsole />
              </div>
              <div className="lg:col-span-1">
                <FateGraph />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="persistence" className="mt-6">
            <PersistenceManager />
          </TabsContent>

          <TabsContent value="ial" className="mt-6 space-y-4">
            <IALCompiler />
            <IALASTViewer />
            <IALExecutor />
          </TabsContent>

          <TabsContent value="ai" className="mt-6 space-y-4">
            <AIAssistantComponent />
            <TemplateRuleManager />
          </TabsContent>

          <TabsContent value="runtime" className="mt-6 space-y-4">
            <SEEDRuntimeSimulator />
            <SEEDRuntimeVisualizer />
          </TabsContent>

          <TabsContent value="control-center" className="mt-6">
            <SeedControlCenter />
          </TabsContent>

          <TabsContent value="ose" className="mt-6 space-y-4">
            <OSEVisualizer />
            <FateConvergenceChart />
            <NineCoreHeatmap />
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <ApiDocs />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-muted-foreground font-mono">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Aetherion Civilization Technology</span>
          </div>
          <div>Architect-Level • Multi-Core Thinking • Causal-Driven</div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
