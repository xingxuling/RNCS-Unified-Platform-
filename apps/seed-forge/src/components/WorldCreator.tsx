import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { worldEngine } from '@/lib/worldEngine';
import { Globe, Plus, User } from 'lucide-react';
import { toast } from 'sonner';

export const WorldCreator = () => {
  const [worldName, setWorldName] = useState('');
  const [entityName, setEntityName] = useState('');

  const createWorld = () => {
    if (!worldName.trim()) {
      toast.error('Please enter a world name');
      return;
    }

    const world = worldEngine.createWorld(worldName);
    toast.success(`World "${worldName}" created`, {
      description: `ID: ${world.id.slice(0, 8)}...`,
    });
    setWorldName('');
  };

  const spawnEntity = () => {
    if (!entityName.trim()) {
      toast.error('Please enter an entity name');
      return;
    }

    const worlds = worldEngine.getWorlds();
    if (worlds.length === 0) {
      toast.error('Create a world first');
      return;
    }

    const entity = worldEngine.spawnEntity(entityName, worlds[0].id);
    toast.success(`Entity "${entityName}" spawned`, {
      description: `Consciousness: ${entity.consciousness.toFixed(1)}`,
    });
    setEntityName('');
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-glow-cyan">Create World</h3>
        </div>
        
        <div className="space-y-3">
          <Input
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
            placeholder="Enter world name..."
            className="bg-secondary/50 border-primary/20 focus:border-primary/50"
            onKeyPress={(e) => e.key === 'Enter' && createWorld()}
          />
          <Button
            onClick={createWorld}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Initialize World
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-card/30 backdrop-blur border-consciousness/20">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-consciousness" />
          <h3 className="text-lg font-semibold text-glow-purple">Spawn Entity</h3>
        </div>
        
        <div className="space-y-3">
          <Input
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            placeholder="Enter entity name..."
            className="bg-secondary/50 border-consciousness/20 focus:border-consciousness/50"
            onKeyPress={(e) => e.key === 'Enter' && spawnEntity()}
          />
          <Button
            onClick={spawnEntity}
            className="w-full bg-consciousness hover:bg-consciousness/90 text-consciousness-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Spawn Entity
          </Button>
        </div>
      </Card>
    </div>
  );
};
