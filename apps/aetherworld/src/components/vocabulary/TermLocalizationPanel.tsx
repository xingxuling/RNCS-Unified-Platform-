import { getLocalizationStatus } from "@/lib/vocabulary/termLocalizationEngine";
import { TERM_LOCALES } from "@/constants/vocabulary/termLocalizationLocales";

export function TermLocalizationPanel() {
  const rows = getLocalizationStatus();
  const totalMissing = rows.reduce((a, r) => a + r.missingCount, 0);
  const totalStale = rows.reduce((a, r) => a + r.staleCount, 0);
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-display">词汇本地化覆盖</h3>
        <span className="text-xs text-muted-foreground">缺失 {totalMissing} · stale {totalStale}</span>
      </div>
      <div className="overflow-auto max-h-[480px]">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr><th className="text-left py-1">术语</th>{TERM_LOCALES.map((l) => <th key={l.id} className="text-left">{l.id}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.termId} className="border-t border-border/40">
                <td className="py-1">{r.chineseTerm}</td>
                {TERM_LOCALES.map((l) => {
                  const s = r.coverage[l.id];
                  const cls = s === "OK" ? "text-green-500" : s === "STALE" ? "text-amber-400" : "text-red-400";
                  return <td key={l.id} className={cls}>{s}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
