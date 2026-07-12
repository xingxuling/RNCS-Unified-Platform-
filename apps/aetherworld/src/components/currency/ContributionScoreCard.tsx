import { getContributionType } from "@/constants/currency/contributionTypes";

interface Props {
  today: { earnedToday: Record<string, number>; entriesToday: number; byContribution: Record<string, number> };
}

export function ContributionScoreCard({ today }: Props) {
  const contribs = Object.entries(today.byContribution);
  return (
    <div className="border rounded-md p-4 space-y-3 bg-card">
      <div>
        <h3 className="text-sm font-medium">今日贡献</h3>
        <p className="text-[11px] text-muted-foreground">仅统计今天的贡献条目。</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-border/60 rounded p-2">
          <div className="text-[10px] text-muted-foreground">今日条目数</div>
          <div className="text-xl font-semibold">{today.entriesToday}</div>
        </div>
        <div className="border border-border/60 rounded p-2">
          <div className="text-[10px] text-muted-foreground">获得 (合计)</div>
          <div className="text-xl font-semibold">
            {Object.values(today.earnedToday).reduce((a, b) => a + b, 0).toFixed(2)}
          </div>
        </div>
      </div>
      {contribs.length === 0 ? (
        <p className="text-xs text-muted-foreground">今天还没有贡献记录。试着生成模型、写剧情或运行 QA。</p>
      ) : (
        <ul className="space-y-1">
          {contribs.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between text-xs">
              <span>{getContributionType(k as never)?.label ?? k}</span>
              <span className="text-amber-400 font-medium">×{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
