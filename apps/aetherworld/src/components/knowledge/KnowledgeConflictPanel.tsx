import { Badge } from "@/components/ui/badge";
import type { KnowledgeConflict } from "@/lib/knowledge/knowledgeConflictDetector";

export function KnowledgeConflictPanel({ conflicts }: { conflicts: KnowledgeConflict[] }) {
  if (!conflicts.length) {
    return <div className="text-xs text-muted-foreground">没有检测到知识冲突。</div>;
  }
  return (
    <div className="space-y-2">
      {conflicts.map((c, i) => (
        <div key={i} className="rounded-md border border-border/60 p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="font-medium">{c.conflictType}</div>
            <Badge variant={c.severity === "CRITICAL" || c.severity === "HIGH" ? "destructive" : "outline"}>
              {c.severity}
            </Badge>
          </div>
          <div className="text-muted-foreground">{c.explanation}</div>
          <div>修复建议：{c.suggestedFix}</div>
          <div className="text-[10px] text-muted-foreground">涉及条目：{c.entries.join(", ")}</div>
        </div>
      ))}
    </div>
  );
}
