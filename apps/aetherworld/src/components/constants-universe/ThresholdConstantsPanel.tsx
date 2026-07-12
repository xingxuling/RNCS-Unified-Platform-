import { THRESHOLD_CONSTANTS } from "@/constants/constant-universe/thresholdConstants";

export function ThresholdConstantsPanel() {
  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <th className="p-2">ID</th>
            <th className="p-2">名称</th>
            <th className="p-2 w-20">值</th>
            <th className="p-2">说明</th>
            <th className="p-2">引擎</th>
          </tr>
        </thead>
        <tbody>
          {THRESHOLD_CONSTANTS.map((t) => (
            <tr key={t.id} className="border-t align-top">
              <td className="p-2 font-mono text-xs">{t.id}</td>
              <td className="p-2">{t.name}</td>
              <td className="p-2 font-mono">{String(t.value)}</td>
              <td className="p-2 text-muted-foreground">{t.description}</td>
              <td className="p-2 text-xs text-muted-foreground">{t.usedByEngines.join("/")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
