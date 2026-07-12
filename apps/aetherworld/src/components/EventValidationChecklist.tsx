import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { getEventValidation } from "@/lib/eventValidationEngine";

export function EventValidationChecklist({
  eventId,
  onProgress,
}: {
  eventId: string;
  onProgress?: (checkedIds: string[]) => void;
}) {
  const { rule } = getEventValidation(eventId);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const total = rule.checklist.length;
  const done = Object.values(checked).filter(Boolean).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="aether-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Event Validation · 事件回验清单
        </div>
        <div className="font-mono text-xs text-primary">{done} / {total} · {progress}%</div>
      </div>
      <div className="mt-3 space-y-2">
        {rule.checklist.map((item, i) => {
          const id = `${eventId}-${i}`;
          return (
            <label key={id} className="flex items-start gap-3 rounded border border-border bg-secondary/20 p-2 cursor-pointer hover:border-primary/30 transition">
              <Checkbox
                checked={!!checked[id]}
                onCheckedChange={(v) => {
                  const next = { ...checked, [id]: Boolean(v) };
                  setChecked(next);
                  onProgress?.(Object.entries(next).filter(([, v]) => v).map(([k]) => k));
                }}
              />
              <span className="text-xs text-foreground leading-relaxed">{item}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground">
        回验指标：{rule.metricKeys.join(" · ")}
      </div>
    </div>
  );
}
