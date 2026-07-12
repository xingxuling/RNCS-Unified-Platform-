import { ListChecks } from "lucide-react";
import type { UsageExample } from "@/lib/usageExampleCalculus";

export function ExampleActionSteps({ example }: { example: UsageExample }) {
  return (
    <div className="aether-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <ListChecks className="w-3.5 h-3.5 text-primary" />
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">下一步动作</div>
      </div>
      <ul className="text-sm space-y-1.5 list-decimal pl-5">
        {example.nextActions.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
      <div className="mt-3 pt-3 border-t border-border/40">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">验证点</div>
        <div className="text-sm mt-1 text-foreground/85">{example.validationPoint}</div>
      </div>
    </div>
  );
}
