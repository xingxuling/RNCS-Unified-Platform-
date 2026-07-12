import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { worldEngine } from '@/lib/worldEngine';
import { Terminal } from 'lucide-react';

export const SystemConsole = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateLogs = () => {
      const eventLog = worldEngine.getEventLog();
      setLogs(eventLog);
    };

    updateLogs();
    const interval = setInterval(updateLogs, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-glow-cyan">System Event Log</h3>
        <div className="ml-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">LIVE</span>
          </div>
        </div>
      </div>

      <div
        ref={consoleRef}
        className="bg-secondary/30 rounded-lg p-4 font-mono text-xs h-96 overflow-y-auto border border-primary/10"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground">
            System initialized. Awaiting operations...
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className="text-foreground/80 hover:text-foreground hover:bg-primary/5 px-2 py-1 rounded transition-colors"
              >
                {log}
              </div>
            ))}
          </div>
        )}
        
        {/* Cursor */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-primary">{'>'}</span>
          <div className="w-2 h-3 bg-primary animate-pulse" />
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        All operations are logged in real-time • Aetherion Protocol v0.5
      </div>
    </Card>
  );
};
