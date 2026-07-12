import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target } from 'lucide-react';
import { oseEngine, FateConvergenceModel } from '@/lib/ose';

/**
 * Fate Convergence Chart Component
 * Displays fate convergence over time and projections
 */
export const FateConvergenceChart = () => {
  const [convergenceHistory, setConvergenceHistory] = useState<number[]>([]);
  const [projections, setProjections] = useState<any[]>([]);
  const [currentConvergence, setCurrentConvergence] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fateModel = new FateConvergenceModel();

  useEffect(() => {
    const updateConvergence = () => {
      try {
        const state = oseEngine.getState();
        if (!state) return;
        
        const convergence = fateModel.calculateConvergence(state);
        
        setCurrentConvergence(convergence);
        setConvergenceHistory(prev => {
          const newHistory = [...prev, convergence];
          return newHistory.slice(-50); // Keep last 50 points
        });

        // Calculate projections
        try {
          const proj = fateModel.projectFate(state, 5);
          setProjections(proj);
        } catch (error) {
          console.warn('Failed to calculate fate projections:', error);
        }
      } catch (error) {
        console.warn('Failed to update convergence:', error);
      }
    };

    updateConvergence();
    const interval = setInterval(updateConvergence, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw convergence line
    if (convergenceHistory.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const stepX = width / (convergenceHistory.length - 1);
      convergenceHistory.forEach((value, index) => {
        const x = index * stepX;
        const y = height - (value * height);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Fill area under curve
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }

    // Draw current convergence indicator
    if (currentConvergence > 0) {
      const y = height - (currentConvergence * height);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(width - 10, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw value label
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText((currentConvergence * 100).toFixed(1) + '%', width - 15, y - 10);
    }

    // Draw threshold lines
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    const thresholdY = height - (0.8 * height);
    ctx.beginPath();
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(width, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw threshold label
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('80% Threshold', 5, thresholdY - 5);
  }, [convergenceHistory, currentConvergence]);

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle>命运收敛曲线</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Convergence */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold">当前收敛度</span>
          </div>
          <div className="text-2xl font-mono text-primary">
            {(currentConvergence * 100).toFixed(1)}%
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full h-48 border border-border rounded bg-secondary/10"
          />
        </div>

        {/* Projections */}
        {projections.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">命运投影</div>
            <div className="grid grid-cols-3 gap-2">
              {projections.slice(0, 3).map((proj, i) => (
                <div
                  key={i}
                  className="p-3 bg-secondary/30 rounded border border-border"
                >
                  <div className="text-xs text-muted-foreground mb-1">路径 {i + 1}</div>
                  <div className="text-sm font-mono">
                    {(proj.probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    稳定性: {(proj.stability * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 text-sm">
          {currentConvergence >= 0.8 ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500">高收敛 - 主线程节点对齐</span>
            </>
          ) : currentConvergence >= 0.5 ? (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-yellow-500">中等收敛</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-red-500">低收敛 - 需要对齐</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

