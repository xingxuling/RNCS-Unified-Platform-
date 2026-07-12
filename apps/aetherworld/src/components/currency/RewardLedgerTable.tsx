import type { LedgerEntry } from "@/lib/currency/creditLedgerEngine";

interface Props {
  entries: LedgerEntry[];
  emptyHint?: string;
}

export function RewardLedgerTable({ entries, emptyHint = "暂无账本记录。" }: Props) {
  if (entries.length === 0) {
    return <div className="text-xs text-muted-foreground border rounded-md p-4">{emptyHint}</div>;
  }
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-2 py-1 font-medium">时间</th>
            <th className="text-left px-2 py-1 font-medium">单位</th>
            <th className="text-right px-2 py-1 font-medium">数量</th>
            <th className="text-left px-2 py-1 font-medium">方向</th>
            <th className="text-left px-2 py-1 font-medium">贡献</th>
            <th className="text-left px-2 py-1 font-medium">来源</th>
            <th className="text-left px-2 py-1 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-border/40">
              <td className="px-2 py-1 text-muted-foreground whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
              <td className="px-2 py-1 font-mono text-[10px]">{e.unitType}</td>
              <td className={`px-2 py-1 text-right font-medium ${e.direction === "EARN" ? "text-emerald-400" : e.direction === "SPEND" ? "text-amber-400" : "text-muted-foreground"}`}>
                {e.direction === "SPEND" ? "-" : ""}{e.amount.toFixed(2)}
              </td>
              <td className="px-2 py-1">{e.direction}</td>
              <td className="px-2 py-1">{e.contributionType}</td>
              <td className="px-2 py-1 text-muted-foreground">{e.sourceEngine}</td>
              <td className="px-2 py-1 truncate max-w-[240px]" title={e.description}>{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
