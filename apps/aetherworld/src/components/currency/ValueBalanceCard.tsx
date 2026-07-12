import { VALUE_UNITS } from "@/constants/currency/valueUnitTypes";
import type { BalanceSummary } from "@/lib/currency/creditLedgerEngine";

interface Props {
  balance: BalanceSummary;
  includeFounder?: boolean;
}

export function ValueBalanceCard({ balance, includeFounder }: Props) {
  const units = VALUE_UNITS.filter((u) => includeFounder || !u.founderOnly);
  return (
    <div className="border rounded-md p-4 space-y-3 bg-card">
      <div>
        <h3 className="text-sm font-medium">余额 · Internal Balance</h3>
        <p className="text-[11px] text-muted-foreground">所有数值均为 Aetherworld 内部积分，不可提现。</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {units.map((u) => (
          <div key={u.id} className="border border-border/60 rounded p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{u.id}</div>
            <div className="text-sm font-medium">{u.userFriendlyName}</div>
            <div className="text-xl font-semibold text-amber-400">{(balance.byUnit[u.id] ?? 0).toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground line-clamp-2">{u.description}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground">共 {balance.totalEntries} 条账本记录。</div>
    </div>
  );
}
