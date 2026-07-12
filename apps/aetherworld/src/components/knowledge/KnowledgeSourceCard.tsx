import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeSource } from "@/lib/knowledge/knowledgeSourceRegistry";

export function KnowledgeSourceCard({ source }: { source: KnowledgeSource }) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{source.sourceName}</div>
          <div className="text-xs text-muted-foreground">{source.description}</div>
        </div>
        <Badge variant="outline">{source.sourceType}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <Badge variant="outline">信任：{source.trustLevel}</Badge>
        <Badge variant="outline">权限：{source.accessLevel}</Badge>
        <Badge variant="outline">新鲜度：{source.freshnessLevel}</Badge>
        <Badge variant="outline">归属：{source.ownerMode}</Badge>
        {source.citationRequired && <Badge variant="destructive">需要引用</Badge>}
      </div>
    </Card>
  );
}
