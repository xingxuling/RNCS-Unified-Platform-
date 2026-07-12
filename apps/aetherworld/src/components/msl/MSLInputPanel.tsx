import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MSL_EXAMPLES } from "@/constants/msl/mslExamplePrograms";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRun?: () => void;
}

export function MSLInputPanel({ value, onChange, onRun }: Props) {
  const [showEx, setShowEx] = useState(false);
  return (
    <Card className="p-4 space-y-3 aether-card-elevated">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">MSL 输入</div>
          <div className="text-xs text-muted-foreground">支持：单条 / 多条 / 带编号 / BLOCK / PROGRAM</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowEx(s => !s)}>示例</Button>
          {onRun && <Button size="sm" onClick={onRun}>解析</Button>}
        </div>
      </div>

      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={10}
        placeholder={`例如：\n55555\n34230\nBLOCK 49..60\nPROGRAM RESEED_CHAIN {\n  49:00000\n  50:00001\n  ...\n}`}
        className="font-mono text-sm"
      />

      {showEx && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">预置示例（点击载入）：</div>
          <div className="flex flex-wrap gap-2">
            {MSL_EXAMPLES.map(ex => (
              <Badge
                key={ex.id}
                variant="outline"
                className="cursor-pointer hover:bg-secondary"
                onClick={() => onChange(ex.source)}
              >
                {ex.title}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
