import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { worldEngine, WorldState } from '@/lib/worldEngine';
import { Activity, Zap, Globe, Cpu } from 'lucide-react';

export const WorldDashboard = () => {
  const [worlds, setWorlds] = useState<WorldState[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    activeWorlds: 0,
    totalEntropy: 0,
    causalOperations: 0,
    uptime: 0,
  });

  useEffect(() => {
    const updateStatus = () => {
      const currentWorlds = worldEngine.getWorlds();
      const entities = worldEngine.getEntities();
      const causalNodes = worldEngine.getCausalGraph();
      
      setWorlds(currentWorlds);
      setSystemStatus({
        activeWorlds: currentWorlds.filter(w => w.status === 'active').length,
        totalEntropy: currentWorlds.reduce((sum, w) => sum + w.entropy, 0),
        causalOperations: causalNodes.length,
        uptime: Date.now() - (currentWorlds[0]?.timestamp || Date.now()),
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: WorldState['status']) => {
    switch (status) {
      case 'active': return 'bg-primary text-primary-foreground';
      case 'initializing': return 'bg-accent text-accent-foreground';
      case 'paused': return 'bg-muted text-muted-foreground';
      case 'collapsed': return 'bg-destructive text-destructive-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{systemStatus.activeWorlds}</div>
              <div className="text-xs text-muted-foreground">Active Worlds</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur border-accent/20 hover:border-accent/40 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">
                {systemStatus.totalEntropy.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">System Entropy</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur border-consciousness/20 hover:border-consciousness/40 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-consciousness/10">
              <Zap className="w-5 h-5 text-consciousness" />
            </div>
            <div>
              <div className="text-2xl font-bold text-consciousness">
                {systemStatus.causalOperations}
              </div>
              <div className="text-xs text-muted-foreground">Causal Operations</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur border-border hover:border-primary/40 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Cpu className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.floor(systemStatus.uptime / 1000)}s
              </div>
              <div className="text-xs text-muted-foreground">System Uptime</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Worlds */}
      <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
        <h3 className="text-lg font-semibold mb-4 text-glow-cyan">Active Universes</h3>
        {worlds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No worlds created yet. Initialize a world to begin.
          </div>
        ) : (
          <div className="space-y-3">
            {worlds.map((world) => (
              <div
                key={world.id}
                className="p-4 rounded-lg bg-secondary/50 border border-primary/10 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <div>
                      <div className="font-semibold">{world.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        ID: {world.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">Causal Weight</div>
                      <div className="font-bold text-accent">{world.causalWeight.toFixed(2)}</div>
                    </div>
                    <Badge className={getStatusColor(world.status)}>
                      {world.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
