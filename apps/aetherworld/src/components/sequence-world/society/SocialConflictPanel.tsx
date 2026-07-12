import type { SocialConflict } from "@/lib/sequence-world/society/socialConflictEngine";
import { SOCIAL_CONFLICT_LABELS } from "@/constants/sequence-world/society/socialConflictTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SocialConflictPanel({ conflicts }: { conflicts: SocialConflict[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">社会冲突 · Social Conflicts（{conflicts.length}）</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {conflicts.map(c => (
          <div key={c.conflictId} className="rounded border p-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{SOCIAL_CONFLICT_LABELS[c.conflictType]}</div>
              <Badge variant="outline" className="text-[10px]">升级风险 {(c.escalationRisk*100).toFixed(0)}%</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{c.rootCause}</div>
            <div className="text-xs">可能解决：{c.possibleResolutions.join("、")}</div>
            <div className="text-[10px] text-muted-foreground">{c.safetyNote}</div>
          </div>
        ))}
        {!conflicts.length && <div className="text-sm text-muted-foreground">暂无社会冲突。</div>}
      </CardContent>
    </Card>
  );
}
