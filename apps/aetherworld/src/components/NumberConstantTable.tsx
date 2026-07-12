import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NUMBER_CONSTANTS } from "@/constants/numberConstants";

export function NumberConstantTable({ professional = false }: { professional?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>数字常数 0–9</CardTitle>
        <p className="text-xs text-muted-foreground">所有计算法对 0–9 的解读以本表为准。</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2 pr-3">数字</th>
                <th className="py-2 pr-3">{professional ? "名称" : "通俗名"}</th>
                <th className="py-2 pr-3">含义</th>
                <th className="py-2 pr-3">用户语言</th>
                <th className="py-2 pr-3">默认权重</th>
              </tr>
            </thead>
            <tbody>
              {NUMBER_CONSTANTS.map((n) => (
                <tr key={n.digit} className="border-b last:border-b-0 align-top">
                  <td className="py-2 pr-3 font-mono text-base">{n.digit}</td>
                  <td className="py-2 pr-3">{professional ? n.name : n.userFriendlyName}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{professional ? n.coreMeaning : n.userFriendlyName + "（" + n.coreMeaning.split("、").slice(0,2).join("、") + "…）"}</td>
                  <td className="py-2 pr-3">{n.userFriendlyName}</td>
                  <td className="py-2 pr-3"><Badge variant="outline">{n.defaultWeight}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
