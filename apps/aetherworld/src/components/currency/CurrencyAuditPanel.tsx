import { useState } from "react";
import { runAudit } from "@/lib/currency/sequenceCurrencyEngine";
import type { CurrencyAuditResult } from "@/lib/currency/currencyAuditEngine";
import type { SubjectMode } from "@/lib/currency/rewardCalculationEngine";

interface Props {
  subjectMode: SubjectMode;
}

const STATUS_STYLES: Record<CurrencyAuditResult["status"], string> = {
  PASS: "text-emerald-400 border-emerald-500/40 bg-emerald-950/20",
  WARN: "text-yellow-300 border-yellow-500/40 bg-yellow-950/20",
  FAIL: "text-red-400 border-red-500/40 bg-red-950/20",
};

export function CurrencyAuditPanel({ subjectMode }: Props) {
  const [result, setResult] = useState<CurrencyAuditResult | null>(null);

  function run() {
    setResult(runAudit(subjectMode));
  }

  return (
    <div className="border rounded-md p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">货币审计 · Currency Audit</h3>
          <p className="text-[11px] text-muted-foreground">检查是否出现现实货币暗示 / 投资承诺 / 异常膨胀。</p>
        </div>
        <button onClick={run} className="text-xs px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200">运行审计</button>
      </div>
      {result && (
        <div className={`border rounded p-3 ${STATUS_STYLES[result.status]}`}>
          <div className="text-sm font-semibold">Status: {result.status}</div>
          <div className="text-[10px] opacity-70">{new Date(result.checkedAt).toLocaleString()} · {subjectMode}</div>
          {result.issues.length === 0 ? (
            <p className="text-xs mt-2">未发现问题。</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs">
              {result.issues.map((i, idx) => (
                <li key={idx}>
                  <span className="font-mono text-[10px] mr-1">[{i.severity}]</span>
                  {i.issue}
                  <div className="text-[10px] opacity-80 ml-4">修复建议：{i.suggestedFix}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 text-[11px] opacity-90">
            建议：{result.recommendations.join(" / ")}
          </div>
        </div>
      )}
    </div>
  );
}
