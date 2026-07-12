import { useMemo, useState } from "react";
import { detectConstantConflicts } from "@/lib/constants-universe/constantConflictDetector";
import { Button } from "@/components/ui/button";

const COLOR: Record<string, string> = {
  LOW: "text-emerald-600", MEDIUM: "text-amber-600", HIGH: "text-orange-600", CRITICAL: "text-red-600",
};

export function ConstantConflictPanel() {
  const [tick, setTick] = useState(0);
  const conflicts = useMemo(() => detectConstantConflicts(), [tick]);
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">检测到 {conflicts.length} 项冲突</p>
        <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>重新检测</Button>
      </div>
      {conflicts.length === 0 ? (
        <p className="text-sm text-emerald-600">未发现常数冲突。</p>
      ) : (
        <div className="space-y-2">
          {conflicts.map((c) => (
            <div key={c.conflictId} className="border rounded-md p-3">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-xs">{c.conflictId}</span>
                <span className={`text-xs font-semibold ${COLOR[c.severity]}`}>{c.severity}</span>
              </div>
              <p className="text-sm mt-1">{c.explanation}</p>
              <p className="text-xs mt-1 text-muted-foreground">建议：{c.suggestedFix}</p>
              <p className="text-xs mt-1 text-muted-foreground">涉及：{c.constants.join("、")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
