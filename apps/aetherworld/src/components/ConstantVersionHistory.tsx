import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getVersionHistory, type ConstantVersion } from "@/lib/constantVersionManager";

export function ConstantVersionHistory() {
  const [list, setList] = useState<ConstantVersion[]>([]);
  useEffect(() => { setList(getVersionHistory()); }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>常数版本历史</CardTitle>
        <p className="text-xs text-muted-foreground">每次常数变更都会写入版本记录。</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {list.map((v, i) => (
          <div key={i} className="rounded border p-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{v.version}</span>
              <Badge variant="outline">{new Date(v.changedAt).toLocaleString()}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">by {v.changedBy}</div>
            <div className="text-xs mt-1">{v.notes}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {v.changedGroups.map((g) => <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
