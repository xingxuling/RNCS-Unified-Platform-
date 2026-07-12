import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Activity } from 'lucide-react';
import { oseEngine } from '@/lib/ose';
import { CoreType } from '@/lib/ose';

/**
 * Nine-Core Heatmap Component
 * Displays activation heatmap for all nine cores
 */
export const NineCoreHeatmap = () => {
  const [coreStates, setCoreStates] = useState<Map<CoreType, any>>(new Map());
  const [history, setHistory] = useState<Map<CoreType, number[]>>(new Map());

  useEffect(() => {
    const updateCores = () => {
      const cores = oseEngine.getCoreResults();
      if (!cores || cores.size === 0) return;
      
      setCoreStates(cores);

      // Update history
      setHistory(prevHistory => {
        const newHistory = new Map<CoreType, number[]>();
        cores.forEach((core, type) => {
          const prevHist = prevHistory.get(type) || [];
          const newHist = [...prevHist, core.activation];
          newHistory.set(type, newHist.slice(-20)); // Keep last 20 points
        });
        return newHistory;
      });
    };

    updateCores();
    const interval = setInterval(updateCores, 500);

    return () => clearInterval(interval);
  }, []); // Remove history from dependencies to avoid infinite loop

  const getHeatColor = (activation: number): string => {
    if (activation >= 0.8) return 'bg-red-500';
    if (activation >= 0.6) return 'bg-orange-500';
    if (activation >= 0.4) return 'bg-yellow-500';
    if (activation >= 0.2) return 'bg-green-500';
    return 'bg-blue-500';
  }

  const getIntensity = (activation: number): number => {
    return Math.min(100, activation * 100);
  };

  const coreNames: Record<CoreType, string> = {
    control: '控制核心',
    creative: '创造核心',
    perceptual: '感知核心',
    defensive: '防御核心',
    metacognitive: '元认知核心',
    strategic: '战略核心',
    exploratory: '探索核心',
    emotional_harmonic: '情感和谐核心',
    fate_intuition: '命运直觉核心',
  };

  const coreOrder: CoreType[] = [
    'control',
    'creative',
    'perceptual',
    'defensive',
    'metacognitive',
    'strategic',
    'exploratory',
    'emotional_harmonic',
    'fate_intuition',
  ];

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <CardTitle>九核激活热力图</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {coreOrder.map((type) => {
            const core = coreStates?.get(type);
            if (!core) return null;

            const activation = core.activation || 0;
            const confidence = core.confidence || 0;

            return (
              <div
                key={type}
                className="relative p-4 bg-secondary/30 rounded-lg border border-border overflow-hidden"
              >
                {/* Heatmap background */}
                <div
                  className={`absolute inset-0 ${getHeatColor(activation)} opacity-${getIntensity(activation)}`}
                  style={{
                    opacity: activation * 0.3,
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                      {coreNames[type]}
                    </span>
                    <Activity
                      className={`w-4 h-4 ${activation > 0.5 ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}
                    />
                  </div>

                  {/* Activation bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">激活度</span>
                      <span className="font-mono">{(activation * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getHeatColor(activation)} transition-all duration-300`}
                        style={{ width: `${activation * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="text-xs text-muted-foreground">
                    置信度: {(confidence * 100).toFixed(0)}%
                  </div>

                  {/* Mini history chart */}
                  {history?.get(type) && history.get(type)!.length > 1 && (
                    <div className="mt-2 h-8 flex items-end gap-0.5">
                      {history.get(type)!.slice(-10).map((value, i) => (
                        <div
                          key={i}
                          className={`flex-1 ${getHeatColor(value)} rounded-t`}
                          style={{
                            height: `${value * 100}%`,
                            opacity: 0.6,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>低 (0-20%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>中低 (20-40%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span>中 (40-60%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded" />
              <span>中高 (60-80%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>高 (80-100%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

