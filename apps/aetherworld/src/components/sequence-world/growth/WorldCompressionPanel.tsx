import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compressWorld, type WorldCompressionResult } from "@/lib/sequence-world/growth/worldCompressionEngine";
import { WORLD_COMPRESSION_LEVELS, type WorldCompressionLevel } from "@/constants/sequence-world/growth/worldCompressionLevels";
import { useFounderState } from "@/hooks/useFounderState";

export function WorldCompressionPanel() {
  const { active: isFounder } = useFounderState();
  const [level, setLevel] = useState<WorldCompressionLevel>("PLAYABLE_CORE");
  const [result, setResult] = useState<WorldCompressionResult | null>(null);
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={level} onValueChange={v => setLevel(v as WorldCompressionLevel)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {WORLD_COMPRESSION_LEVELS.map(l => (
              <SelectItem key={l.id} value={l.id} disabled={l.id === "FOUNDER_ARCHIVE" && !isFounder}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setResult(compressWorld({ worldId: "world-growth-sandbox", compressionLevel: level, isFounder }))}>压缩</Button>
      </div>
      {result && (
        <div className="text-xs space-y-1">
          <div>{result.summary}</div>
          <div className="text-muted-foreground">下一步：{result.nextRecommendedAction}</div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">保留 {result.keptItems.length}</Badge>
            <Badge variant="outline">归档 {result.archivedItems.length}</Badge>
          </div>
        </div>
      )}
    </Card>
  );
}
