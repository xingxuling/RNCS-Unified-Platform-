import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConflictResult } from "@/lib/narrative/conflictEngine";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function ConflictMap({ conflict }: { conflict: ConflictResult }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">冲突地图</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div><Badge>{conflict.conflictType}</Badge></div>
        <div>主冲突：{conflict.mainConflict}</div>
        <div>表层：{conflict.surfaceConflict}</div>
        <div>潜层：{conflict.hiddenConflict}</div>
        <div>压力等级：<Progress value={conflict.pressureLevel * 100} /></div>
        <div>升级路径：{conflict.escalationPath.join(" → ")}</div>
        <div>解决选项：{conflict.resolutionOptions.join(" / ")}</div>
      </CardContent>
    </Card>
  );
}
