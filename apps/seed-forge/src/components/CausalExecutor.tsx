import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { worldEngine, AetherionOperator } from '@/lib/worldEngine';
import { Sparkles, RotateCw, X, Shuffle, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

export const CausalExecutor = () => {
  const [target, setTarget] = useState('');
  const [selectedOp, setSelectedOp] = useState<AetherionOperator | null>(null);

  const operators = [
    { 
      type: 'CREATE' as AetherionOperator, 
      icon: Sparkles, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      description: 'Manifest new reality structures'
    },
    { 
      type: 'LOOP' as AetherionOperator, 
      icon: RotateCw, 
      color: 'text-consciousness',
      bgColor: 'bg-consciousness/10',
      borderColor: 'border-consciousness/30',
      description: 'Iterate temporal cycles'
    },
    { 
      type: 'BREAK' as AetherionOperator, 
      icon: X, 
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
      description: 'Dissolve causal bonds'
    },
    { 
      type: 'SHIFT' as AetherionOperator, 
      icon: Shuffle, 
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30',
      description: 'Transform state vectors'
    },
    { 
      type: 'WEAVE' as AetherionOperator, 
      icon: GitBranch, 
      color: 'text-foreground',
      bgColor: 'bg-muted',
      borderColor: 'border-border',
      description: 'Connect fate threads'
    },
  ];

  const executeOperation = (op: AetherionOperator) => {
    if (!target.trim()) {
      toast.error('Please specify a target');
      return;
    }

    worldEngine.executeCausal(op, target);
    toast.success(`${op} operation executed on "${target}"`);
    setTarget('');
    setSelectedOp(null);
  };

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <h3 className="text-lg font-semibold mb-4 text-glow-cyan">Aetherion Logic Executor</h3>
      
      <div className="space-y-4">
        {/* Target Input */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Target Entity/World</label>
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter target name..."
            className="bg-secondary/50 border-primary/20 focus:border-primary/50 font-mono"
          />
        </div>

        {/* Operator Selection */}
        <div>
          <label className="text-sm text-muted-foreground mb-3 block">Causal Operator</label>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {operators.map(({ type, icon: Icon, color, bgColor, borderColor, description }) => (
              <button
                key={type}
                onClick={() => setSelectedOp(type)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${selectedOp === type 
                    ? `${borderColor} ${bgColor}` 
                    : 'border-border bg-secondary/30 hover:border-primary/20'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className={`w-6 h-6 ${color}`} />
                  <div className="font-semibold text-sm">{type}</div>
                  <div className="text-xs text-muted-foreground text-center leading-tight">
                    {description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Execute Button */}
        <Button
          onClick={() => selectedOp && executeOperation(selectedOp)}
          disabled={!selectedOp || !target.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          Execute {selectedOp || 'Operation'}
        </Button>

        {/* Syntax Examples */}
        <Card className="p-4 bg-secondary/30 border-accent/20">
          <div className="text-xs font-mono space-y-1">
            <div className="text-muted-foreground mb-2">// Aetherion Syntax Examples:</div>
            <div><span className="text-primary">CREATE</span> World "Genesis"</div>
            <div><span className="text-consciousness">LOOP</span> Entity "Player" <span className="text-muted-foreground">// Reincarnation</span></div>
            <div><span className="text-destructive">BREAK</span> Constraint "Mortality"</div>
            <div><span className="text-accent">SHIFT</span> State "Timeline-Alpha"</div>
            <div><span className="text-foreground">WEAVE</span> Fate "Hero's Journey"</div>
          </div>
        </Card>
      </div>
    </Card>
  );
};
