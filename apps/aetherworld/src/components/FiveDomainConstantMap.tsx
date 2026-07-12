import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FIVE_DOMAIN_CONSTANTS } from "@/constants/fiveDomainConstants";

export function FiveDomainConstantMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>五域常数 · 天地人神风</CardTitle>
        <p className="text-xs text-muted-foreground">五位数从左到右对应五域。</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {FIVE_DOMAIN_CONSTANTS.map((d) => (
            <div key={d.id} className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs text-muted-foreground">位{d.position}</div>
              <div className="text-lg font-medium">{d.name}</div>
              <div className="text-xs text-muted-foreground mb-2">{d.userFriendlyName}</div>
              <div className="text-sm">{d.meaning}</div>
              <div className="text-xs text-muted-foreground mt-2">核心问题：{d.coreQuestion}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
