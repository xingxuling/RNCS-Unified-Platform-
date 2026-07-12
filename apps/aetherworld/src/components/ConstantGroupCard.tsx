import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ConstantGroupMeta } from "@/constants/constantGroups";

export function ConstantGroupCard({ group, count }: { group: ConstantGroupMeta; count: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{group.name}</CardTitle>
          <Badge variant={group.riskOnChange === "CRITICAL" ? "destructive" : "secondary"}>
            {group.riskOnChange}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{group.userFriendlyName}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{group.description}</p>
        <div className="flex flex-wrap gap-1">
          {group.consumers.map((c) => (
            <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>常数数量：{count}</span>
          <span>{group.founderEditable ? "创始人可编辑" : "锁定"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
