import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFounderState } from "@/hooks/useFounderState";
import { getCurrencyOverview, clearCurrencyLedger } from "@/lib/currency/sequenceCurrencyEngine";
import type { SubjectMode } from "@/lib/currency/rewardCalculationEngine";
import { RewardLedgerTable } from "@/components/currency/RewardLedgerTable";
import { CurrencySafetyNote } from "@/components/currency/CurrencySafetyNote";
import { CurrencyExportPanel } from "@/components/currency/CurrencyExportPanel";

export const Route = createFileRoute("/value-ledger")({
  head: () => ({ meta: [{ title: "价值账本 · Value Ledger" }] }),
  component: ValueLedgerPage,
});

function ValueLedgerPage() {
  const { active } = useFounderState();
  const [mode, setMode] = useState<SubjectMode>("DEMO");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { if (active) setMode("FOUNDER"); }, [active]);
  const overview = getCurrencyOverview(mode);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">价值账本 · Value Ledger</h1>
        <p className="text-sm text-muted-foreground">完整的内部积分账本，按主体模式隔离。</p>
      </header>
      <CurrencySafetyNote />
      <div className="border rounded-md p-3 bg-card flex items-center gap-3 text-xs">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">账本</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as SubjectMode)} className="border rounded px-2 py-1 bg-background">
            <option value="DEMO">DEMO</option>
            <option value="REAL">REAL</option>
            {active && <option value="FOUNDER">FOUNDER</option>}
          </select>
        </label>
        <button onClick={() => { if (confirm(`清空 ${mode} 账本？`)) { clearCurrencyLedger(mode); setRefresh((k) => k + 1); } }} className="ml-auto text-[11px] px-2 py-1 rounded bg-red-500/10 text-red-300 hover:bg-red-500/20">清空</button>
      </div>
      <div key={refresh}>
        <RewardLedgerTable entries={overview.recentEntries} />
      </div>
      <CurrencyExportPanel subjectMode={mode} full60Active={false} />
    </div>
  );
}
