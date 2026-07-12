import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFounderState } from "@/hooks/useFounderState";
import { CurrencyAuditPanel } from "@/components/currency/CurrencyAuditPanel";
import { CurrencySafetyNote } from "@/components/currency/CurrencySafetyNote";
import type { SubjectMode } from "@/lib/currency/rewardCalculationEngine";

export const Route = createFileRoute("/currency-audit")({
  head: () => ({ meta: [{ title: "货币审计 · Currency Audit" }] }),
  component: CurrencyAuditPage,
});

function CurrencyAuditPage() {
  const { active } = useFounderState();
  const [mode, setMode] = useState<SubjectMode>("DEMO");
  useEffect(() => { if (active) setMode("FOUNDER"); }, [active]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">货币审计 · Currency Audit</h1>
        <p className="text-sm text-muted-foreground">检查现实货币暗示、投资承诺、Demo / Real 混入、积分异常膨胀等。</p>
      </header>
      <CurrencySafetyNote />
      <div className="border rounded-md p-3 bg-card text-xs">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">审计主体</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as SubjectMode)} className="border rounded px-2 py-1 bg-background">
            <option value="DEMO">DEMO</option>
            <option value="REAL">REAL</option>
            {active && <option value="FOUNDER">FOUNDER</option>}
          </select>
        </label>
      </div>
      <CurrencyAuditPanel subjectMode={mode} />
    </div>
  );
}
