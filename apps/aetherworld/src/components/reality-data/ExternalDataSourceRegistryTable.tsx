import { listExternalDataSources } from "@/lib/reality-data/externalDataSourceRegistry";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ExternalDataSourceRegistryTable() {
  const sources = listExternalDataSources();
  return (
    <Card className="p-4">
      <div className="text-sm font-medium mb-3">外部数据源注册表（{sources.length}）</div>
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="text-left">
              <th className="py-2 pr-3">名称</th>
              <th className="py-2 pr-3">类型</th>
              <th className="py-2 pr-3">可信度</th>
              <th className="py-2 pr-3">隐私</th>
              <th className="py-2 pr-3">访问</th>
              <th className="py-2 pr-3">备注</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.sourceId} className="border-t">
                <td className="py-2 pr-3 font-medium">{s.sourceName}</td>
                <td className="py-2 pr-3"><Badge variant="outline">{s.sourceType}</Badge></td>
                <td className="py-2 pr-3">{s.credibilityLevel}</td>
                <td className="py-2 pr-3">{s.privacyLevel}</td>
                <td className="py-2 pr-3">{s.accessMethod}</td>
                <td className="py-2 pr-3 text-muted-foreground">{s.notes[0] ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
