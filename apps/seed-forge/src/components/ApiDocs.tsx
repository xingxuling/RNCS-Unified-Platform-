import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2 } from 'lucide-react';

export const ApiDocs = () => {
  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Code2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-glow-cyan">API Reference</h3>
      </div>

      <Tabs defaultValue="worlds" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
          <TabsTrigger value="worlds">Worlds</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="causal">Causal</TabsTrigger>
          <TabsTrigger value="fate">Fate</TabsTrigger>
        </TabsList>

        <TabsContent value="worlds" className="space-y-4">
          <ApiMethod
            method="POST"
            endpoint="world.create(name: string)"
            description="Initialize a new world with given name"
            example={`const world = worldEngine.createWorld("Genesis");
// Returns: WorldState object`}
          />
          <ApiMethod
            method="GET"
            endpoint="world.getWorlds()"
            description="Retrieve all active worlds"
            example={`const worlds = worldEngine.getWorlds();
// Returns: WorldState[]`}
          />
          <ApiMethod
            method="POST"
            endpoint="universe.branch(worldId, deviation)"
            description="Create a parallel universe branch"
            example={`const branch = worldEngine.branchUniverse(
  worldId, 
  "Timeline-Alpha"
);`}
          />
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <ApiMethod
            method="POST"
            endpoint="npc.spawn(name, worldId)"
            description="Spawn a conscious entity in specified world"
            example={`const entity = worldEngine.spawnEntity(
  "Protagonist", 
  worldId
);
// Returns: Entity with consciousness value`}
          />
          <ApiMethod
            method="GET"
            endpoint="npc.getEntities()"
            description="Retrieve all spawned entities"
            example={`const entities = worldEngine.getEntities();
// Returns: Entity[]`}
          />
        </TabsContent>

        <TabsContent value="causal" className="space-y-4">
          <ApiMethod
            method="POST"
            endpoint="causal.execute(operator, target, params?)"
            description="Execute Aetherion causal operation"
            example={`worldEngine.executeCausal(
  'CREATE', 
  'Reality-Kernel'
);
// Operators: CREATE | LOOP | BREAK | SHIFT | WEAVE`}
          />
          <ApiMethod
            method="GET"
            endpoint="causal.getGraph()"
            description="Retrieve the complete causal graph"
            example={`const graph = worldEngine.getCausalGraph();
// Returns: CausalNode[]`}
          />
        </TabsContent>

        <TabsContent value="fate" className="space-y-4">
          <ApiMethod
            method="POST"
            endpoint="fate.createNode(entityId, description)"
            description="Create a fate node for an entity"
            example={`const nodeId = worldEngine.createFateNode(
  entityId,
  "Discover ancient artifact"
);`}
          />
          <ApiMethod
            method="POST"
            endpoint="fate.shift(nodeId, newPath)"
            description="Shift fate trajectory"
            example={`worldEngine.executeCausal(
  'SHIFT',
  'fate-node-id'
);`}
          />
        </TabsContent>
      </Tabs>

      <Card className="mt-4 p-4 bg-secondary/30 border-accent/20">
        <div className="text-xs font-mono space-y-2">
          <div className="text-accent font-bold">// Core Architecture:</div>
          <div>1. Reality Kernel - State Management</div>
          <div>2. Aether Logic - Causal Operations</div>
          <div>3. Soul Engine - Consciousness</div>
          <div>4. Fate Weaving - Destiny Graphs</div>
          <div>5. World Rendering - Output Layer</div>
        </div>
      </Card>
    </Card>
  );
};

interface ApiMethodProps {
  method: string;
  endpoint: string;
  description: string;
  example: string;
}

const ApiMethod = ({ method, endpoint, description, example }: ApiMethodProps) => {
  const methodColor = method === 'POST' ? 'text-primary' : 'text-accent';
  
  return (
    <Card className="p-4 bg-secondary/50 border-primary/10">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold ${methodColor}`}>{method}</span>
        <code className="text-sm font-mono text-foreground">{endpoint}</code>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <pre className="bg-background/50 p-3 rounded text-xs font-mono overflow-x-auto border border-border">
        {example}
      </pre>
    </Card>
  );
};
