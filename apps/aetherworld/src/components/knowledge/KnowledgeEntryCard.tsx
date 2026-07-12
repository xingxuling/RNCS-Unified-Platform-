import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KnowledgeEntry } from "@/lib/knowledge/knowledgeSourceRegistry";
import { KnowledgeTypeBadge } from "./KnowledgeTypeBadge";
import { KnowledgeTrustBadge } from "./KnowledgeTrustBadge";
import { evaluateFreshness } from "@/lib/knowledge/knowledgeFreshnessEngine";

export function KnowledgeEntryCard({
  entry,
  onMarkStale,
  founder,
}: {
  entry: KnowledgeEntry;
  onMarkStale?: (id: string) => void;
  founder?: boolean;
}) {
  const f = evaluateFreshness(entry);
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{entry.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{entry.summary}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <KnowledgeTypeBadge type={entry.knowledgeType} />
          <KnowledgeTrustBadge level={entry.trustLevel} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <Badge variant="outline">来源：{entry.sourceType}</Badge>
        <Badge variant="outline">权限：{entry.accessLevel}</Badge>
        <Badge variant="outline">新鲜度：{entry.freshnessLevel}</Badge>
        {entry.language && <Badge variant="outline">语言：{entry.language}</Badge>}
        {entry.relatedEngines.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
        {entry.tags.map(t => <Badge key={t} variant="outline">#{t}</Badge>)}
        {f.stale && <Badge variant="destructive">过期</Badge>}
      </div>
      {f.warning && <div className="text-[11px] text-amber-500">{f.warning}</div>}
      {founder && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">查看完整正文</summary>
          <pre className="whitespace-pre-wrap text-xs mt-2 bg-muted/30 p-2 rounded">{entry.body}</pre>
        </details>
      )}
      {onMarkStale && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => onMarkStale(entry.id)}>
            {entry.stale ? "取消 stale" : "标记 stale"}
          </Button>
        </div>
      )}
    </Card>
  );
}
