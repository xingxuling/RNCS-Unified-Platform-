import type { RecallValidationResult } from "@/lib/recallValidationEngine";
import { Check, X } from "lucide-react";

export function RecallValidationChecklist({ items }: { items: RecallValidationResult[] }) {
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Validation · 回验检查清单</div>
      <ul className="space-y-1.5">
        {items.map(it => (
          <li key={it.item.id} className="flex items-start gap-2 text-xs">
            {it.passed
              ? <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              : <X className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />}
            <div>
              <div className="text-foreground">{it.item.label} · {it.item.question}</div>
              <div className="text-[10px] text-muted-foreground">{it.hint}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
