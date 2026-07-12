import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { worldEngine, CausalNode } from '@/lib/worldEngine';
import { GitBranch } from 'lucide-react';
import { getOperatorColor, getAllOperators } from '@/utils/operators';

export const FateGraph = () => {
  const [nodes, setNodes] = useState<CausalNode[]>([]);

  useEffect(() => {
    const updateNodes = () => {
      setNodes(worldEngine.getCausalGraph());
    };

    updateNodes();
    const interval = setInterval(updateNodes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20 h-full">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-glow-cyan">Causal Fate Graph</h3>
      </div>

      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">🕸️</div>
            <div>No causal nodes yet</div>
            <div className="text-sm">Execute operations to build the fate graph</div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {nodes.map((node, index) => (
            <div
              key={node.id}
              className="relative"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Connection Line */}
              {index > 0 && (
                <div className="absolute left-6 -top-3 w-0.5 h-3 bg-primary/30" />
              )}
              
              {/* Node */}
              <div
                className={`
                  p-3 rounded-lg border-2 transition-all
                  ${getOperatorColor(node.type)}
                  ${node.executed ? 'opacity-100' : 'opacity-50'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-current mt-1 animate-pulse" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{node.type}</span>
                      <span className="text-xs opacity-60">
                        Weight: {node.weight.toFixed(3)}
                      </span>
                    </div>
                    <div className="text-xs opacity-80">{node.description}</div>
                    <div className="text-xs font-mono mt-1 opacity-60">
                      {node.id.slice(0, 12)}...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">Operator Legend:</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {getAllOperators().map((op) => (
            <div key={op} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getOperatorColor(op)}`} />
              <span className="text-xs">{op}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
