import { exportContributionReport, exportCurrencyAuditReport, exportValueLedger, exportWorldResources, triggerBrowserDownload } from "@/lib/currency/currencyExportEngine";
import type { SubjectMode } from "@/lib/currency/rewardCalculationEngine";
import { useState } from "react";

interface Props {
  subjectMode: SubjectMode;
  full60Active: boolean;
}

export function CurrencyExportPanel({ subjectMode, full60Active }: Props) {
  const [confirming, setConfirming] = useState<null | (() => void)>(null);

  function maybeExport(fn: () => void) {
    if (full60Active) {
      setConfirming(() => fn);
      return;
    }
    fn();
  }

  const buttons: { label: string; fn: () => void }[] = [
    { label: "导出账本 (JSON)", fn: () => triggerBrowserDownload(exportValueLedger(subjectMode, { full60Active })) },
    { label: "贡献报告 (MD)",  fn: () => triggerBrowserDownload(exportContributionReport(subjectMode, { full60Active })) },
    { label: "世界资源 (JSON)", fn: () => triggerBrowserDownload(exportWorldResources(subjectMode, { full60Active })) },
    { label: "审计报告 (MD)",  fn: () => triggerBrowserDownload(exportCurrencyAuditReport(subjectMode, { full60Active })) },
  ];

  return (
    <div className="border rounded-md p-4 space-y-3 bg-card">
      <div>
        <h3 className="text-sm font-medium">导出</h3>
        <p className="text-[11px] text-muted-foreground">导出文件均附带非现实货币声明与 metadata。</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {buttons.map((b) => (
          <button key={b.label} onClick={() => maybeExport(b.fn)} className="text-xs px-2 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-200">
            {b.label}
          </button>
        ))}
      </div>
      {confirming && (
        <div className="border border-yellow-500/40 rounded p-2 text-xs text-yellow-100 bg-yellow-900/10 space-y-1">
          <div>当前处于 Full60 模式，导出包含私有资料。请确认。</div>
          <div className="flex gap-2">
            <button onClick={() => { confirming(); setConfirming(null); }} className="px-2 py-0.5 rounded bg-yellow-500/30">确认导出</button>
            <button onClick={() => setConfirming(null)} className="px-2 py-0.5 rounded bg-white/5">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
