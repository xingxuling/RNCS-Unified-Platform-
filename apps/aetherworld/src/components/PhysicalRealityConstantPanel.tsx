import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { groupPhysicalByCategory } from "@/constants/physicalRealityConstants";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default", EXPERIMENTAL: "secondary", PLACEHOLDER: "outline",
};

export function PhysicalRealityConstantPanel() {
  const map = groupPhysicalByCategory();
  return (
    <Card>
      <CardHeader>
        <CardTitle>物理现实常数 · Phase C 接口</CardTitle>
        <p className="text-xs text-muted-foreground">这是现实变量接口，不是已验证的物理预测模型。占位项后续逐步打开。</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(map).map(([cat, list]) => (
          <div key={cat}>
            <div className="text-xs text-muted-foreground mb-1">{cat}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {list.map((c) => (
                <div key={c.id} className="rounded border p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.name}</span>
                    <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                  </div>
                  <div className="text-muted-foreground mt-1">{c.description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
