import { useEffect, useMemo, useState } from "react";
import { CONTRIBUTION_TYPES, type ContributionTypeId } from "@/constants/currency/contributionTypes";
import { clearCurrencyLedger, getCurrencyOverview, recordContribution, type CurrencyOverview } from "@/lib/currency/sequenceCurrencyEngine";
import type { SubjectMode } from "@/lib/currency/rewardCalculationEngine";
import { useFounderState } from "@/hooks/useFounderState";
import { ValueBalanceCard } from "./ValueBalanceCard";
import { ContributionScoreCard } from "./ContributionScoreCard";
import { RewardLedgerTable } from "./RewardLedgerTable";
import { AssetValueCard } from "./AssetValueCard";
import { WorldResourcePanel } from "./WorldResourcePanel";
import { CurrencyAuditPanel } from "./CurrencyAuditPanel";
import { CurrencyExportPanel } from "./CurrencyExportPanel";
import { CurrencySafetyNote } from "./CurrencySafetyNote";

export function SequenceCurrencyPanel() {
  const { active: founderActive } = useFounderState();
  const [subjectMode, setSubjectMode] = useState<SubjectMode>("DEMO");
  const [full60, setFull60] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [contributionType, setContributionType] = useState<ContributionTypeId>("CREATE_MODEL");
  const [mslSeed, setMslSeed] = useState("");

  useEffect(() => {
    if (founderActive) setSubjectMode("FOUNDER");
  }, [founderActive]);

  const overview: CurrencyOverview = useMemo(
    () => getCurrencyOverview(subjectMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subjectMode, refresh],
  );

  function quickRecord() {
    recordContribution({
      contributionType,
      userMode: subjectMode === "FOUNDER" ? "FOUNDER" : subjectMode === "REAL" ? (full60 ? "FULL_60" : "LIGHT_20") : "DEMO",
      qualityScore: 7, usefulnessScore: 7, validationScore: 6, complexityScore: 6, safetyScore: 9, duplicationRisk: 0,
      description: `手动记录：${contributionType}`,
      sourceEngine: "currency.manual",
      msl: mslSeed || undefined,
    });
    setRefresh((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      <CurrencySafetyNote />

      <div className="border rounded-md p-3 bg-card flex flex-wrap gap-3 items-center text-xs">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">主体模式</span>
          <select value={subjectMode} onChange={(e) => setSubjectMode(e.target.value as SubjectMode)} className="border rounded px-2 py-1 bg-background">
            <option value="DEMO">DEMO（演示）</option>
            <option value="REAL">REAL（真实主体）</option>
            {founderActive && <option value="FOUNDER">FOUNDER</option>}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={full60} onChange={(e) => setFull60(e.target.checked)} />
          <span className="text-muted-foreground">Full60（私有）</span>
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { if (confirm(`确认清空 ${subjectMode} 账本？此操作不可恢复。`)) { clearCurrencyLedger(subjectMode); setRefresh((k) => k + 1); } }}
            className="text-[11px] px-2 py-1 rounded bg-red-500/10 text-red-300 hover:bg-red-500/20"
          >
            清空当前账本
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ValueBalanceCard balance={overview.balance} includeFounder={subjectMode === "FOUNDER"} />
        <ContributionScoreCard today={overview.today} />
      </div>

      <div className="border rounded-md p-4 space-y-3 bg-card">
        <div>
          <h3 className="text-sm font-medium">手动记录贡献</h3>
          <p className="text-[11px] text-muted-foreground">用于测试与展示。真实业务通常由对应引擎自动调用。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <label className="space-y-1">
            <span>贡献类型</span>
            <select value={contributionType} onChange={(e) => setContributionType(e.target.value as ContributionTypeId)} className="w-full border rounded px-2 py-1 bg-background">
              {CONTRIBUTION_TYPES.filter((c) => !c.founderOnly || founderActive).map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span>MSL 数列（可选，用于世界资源奖励）</span>
            <input value={mslSeed} onChange={(e) => setMslSeed(e.target.value)} placeholder="例如 55555" maxLength={5} className="w-full border rounded px-2 py-1 bg-background" />
          </label>
          <div className="flex items-end">
            <button onClick={quickRecord} className="text-xs px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 w-full">记录贡献</button>
          </div>
        </div>
      </div>

      <WorldResourcePanel balance={overview.resources} />

      <div>
        <h3 className="text-sm font-medium mb-2">最近账本</h3>
        <RewardLedgerTable entries={overview.recentEntries} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssetValueCard />
        <CurrencyAuditPanel subjectMode={subjectMode} />
      </div>

      <CurrencyExportPanel subjectMode={subjectMode} full60Active={full60} />
    </div>
  );
}
